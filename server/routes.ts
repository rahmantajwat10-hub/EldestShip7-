import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertConversationSchema, insertMessageSchema, insertFlashcardSetSchema,
  insertFlashcardSchema, insertNoteSchema, insertQuizSchema, insertQuizAttemptSchema,
  insertVideoGenerationSchema
} from "@shared/schema";
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import multer from "multer";
import path from "path";
import fs from "fs";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const DEFAULT_OPENAI_MODEL = "gpt-5";

// The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229". 
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-test"
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY_ENV_VAR || "test-key"
});

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat_message') {
          // Handle incoming chat message
          const { conversationId, content, role, model } = message;
          
          // Save user message
          await storage.createMessage({
            conversationId,
            role: 'user',
            content,
            attachments: null
          });

          // Send typing indicator
          ws.send(JSON.stringify({ type: 'typing', isTyping: true }));

          try {
            let aiResponse: string;
            
            if (model.startsWith('gpt')) {
              const response = await openai.chat.completions.create({
                model: DEFAULT_OPENAI_MODEL,
                messages: [{ role: "user", content }],
              });
              aiResponse = response.choices[0].message.content || "Sorry, I couldn't generate a response.";
            } else if (model.startsWith('claude')) {
              const response = await anthropic.messages.create({
                model: DEFAULT_ANTHROPIC_MODEL,
                max_tokens: 1024,
                messages: [{ role: 'user', content }],
              });
              aiResponse = response.content[0].text || "Sorry, I couldn't generate a response.";
            } else {
              aiResponse = "Model not supported";
            }

            // Save AI response
            const savedMessage = await storage.createMessage({
              conversationId,
              role: 'assistant',
              content: aiResponse,
              attachments: null
            });

            // Send response back
            ws.send(JSON.stringify({ 
              type: 'typing', 
              isTyping: false 
            }));

            ws.send(JSON.stringify({ 
              type: 'message', 
              message: savedMessage 
            }));

          } catch (error) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to get AI response: ' + (error as Error).message 
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Default user ID for demo (in production, this would come from authentication)
  const DEFAULT_USER_ID = "default-user";

  // Conversations API
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(DEFAULT_USER_ID);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const data = insertConversationSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const conversation = await storage.createConversation(data);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Invalid conversation data" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.json({ message: "Conversation deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Messages API
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getConversationMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileInfo = {
      id: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    };

    res.json(fileInfo);
  });

  // Flashcard Sets API
  app.get("/api/flashcard-sets", async (req, res) => {
    try {
      const sets = await storage.getUserFlashcardSets(DEFAULT_USER_ID);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcard sets" });
    }
  });

  app.post("/api/flashcard-sets", async (req, res) => {
    try {
      const data = insertFlashcardSetSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const set = await storage.createFlashcardSet(data);
      res.json(set);
    } catch (error) {
      res.status(400).json({ message: "Invalid flashcard set data" });
    }
  });

  app.delete("/api/flashcard-sets/:id", async (req, res) => {
    try {
      await storage.deleteFlashcardSet(req.params.id);
      res.json({ message: "Flashcard set deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flashcard set" });
    }
  });

  // Flashcards API
  app.get("/api/flashcard-sets/:setId/flashcards", async (req, res) => {
    try {
      const cards = await storage.getSetFlashcards(req.params.setId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/flashcard-sets/:setId/flashcards", async (req, res) => {
    try {
      const data = insertFlashcardSchema.parse({
        ...req.body,
        setId: req.params.setId
      });
      const card = await storage.createFlashcard(data);
      res.json(card);
    } catch (error) {
      res.status(400).json({ message: "Invalid flashcard data" });
    }
  });

  app.put("/api/flashcards/:id", async (req, res) => {
    try {
      const card = await storage.updateFlashcard(req.params.id, req.body);
      res.json(card);
    } catch (error) {
      res.status(400).json({ message: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", async (req, res) => {
    try {
      await storage.deleteFlashcard(req.params.id);
      res.json({ message: "Flashcard deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flashcard" });
    }
  });

  // Generate flashcards from content
  app.post("/api/flashcards/generate", async (req, res) => {
    try {
      const { content, subject, count = 5 } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const prompt = `Create ${count} flashcards from the following content. Each flashcard should have a clear question on the front and a concise answer on the back. Format as JSON array with objects containing "front" and "back" properties.

Content: ${content}

Return only the JSON array, no additional text.`;

      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result.flashcards || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate flashcards" });
    }
  });

  // Notes API
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getUserNotes(DEFAULT_USER_ID);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const data = insertNoteSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      const note = await storage.createNote(data);
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: "Invalid note data" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.json({ message: "Note deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Enhance note with AI
  app.post("/api/notes/:id/enhance", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      const prompt = `Enhance and improve the following note by:
1. Fixing grammar and clarity
2. Adding structure and organization
3. Highlighting key concepts
4. Suggesting related topics to explore

Original note:
Title: ${note.title}
Content: ${note.content}

Return the enhanced content as plain text.`;

      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
      });

      const enhancedContent = response.choices[0].message.content || note.content;
      
      const updatedNote = await storage.updateNote(req.params.id, {
        content: enhancedContent
      });

      res.json(updatedNote);
    } catch (error) {
      res.status(500).json({ message: "Failed to enhance note" });
    }
  });

  // Quiz API
  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getUserQuizzes(DEFAULT_USER_ID);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post("/api/quizzes/generate", async (req, res) => {
    try {
      const { subject, difficulty, questionCount = 5, questionTypes = ['multiple-choice'] } = req.body;
      
      if (!subject) {
        return res.status(400).json({ message: "Subject is required" });
      }

      const prompt = `Create a ${difficulty} difficulty quiz about "${subject}" with ${questionCount} questions. 
      
Question types to include: ${questionTypes.join(', ')}

Format as JSON with this structure:
{
  "title": "Quiz title",
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    }
  ]
}

Return only the JSON, no additional text.`;

      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const quizData = JSON.parse(response.choices[0].message.content || "{}");
      
      const quiz = await storage.createQuiz({
        userId: DEFAULT_USER_ID,
        title: quizData.title || `${subject} Quiz`,
        subject,
        difficulty,
        questions: quizData.questions || []
      });

      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Quiz Attempts API
  app.get("/api/quiz-attempts", async (req, res) => {
    try {
      const attempts = await storage.getUserQuizAttempts(DEFAULT_USER_ID);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.post("/api/quizzes/:id/attempts", async (req, res) => {
    try {
      const { answers } = req.body;
      const quiz = await storage.getQuiz(req.params.id);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Calculate score
      const questions = quiz.questions as any[];
      let score = 0;
      
      answers.forEach((answer: any, index: number) => {
        if (questions[index] && answer === questions[index].correctAnswer) {
          score++;
        }
      });

      const attempt = await storage.createQuizAttempt({
        quizId: req.params.id,
        userId: DEFAULT_USER_ID,
        answers,
        score,
        totalQuestions: questions.length
      });

      res.json(attempt);
    } catch (error) {
      res.status(400).json({ message: "Failed to submit quiz attempt" });
    }
  });

  // Video Generation API
  app.get("/api/video-generations", async (req, res) => {
    try {
      const videos = await storage.getUserVideoGenerations(DEFAULT_USER_ID);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video generations" });
    }
  });

  app.post("/api/video-generations", async (req, res) => {
    try {
      const data = insertVideoGenerationSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      
      const video = await storage.createVideoGeneration(data);
      
      // Simulate video generation process (in real app, this would call actual video generation API)
      setTimeout(async () => {
        try {
          await storage.updateVideoGeneration(video.id, {
            status: "completed",
            videoUrl: `https://example.com/videos/${video.id}.mp4`,
            thumbnailUrl: `https://example.com/thumbnails/${video.id}.jpg`,
            completedAt: new Date()
          });
        } catch (error) {
          console.error("Failed to update video generation status:", error);
        }
      }, 5000); // Simulate 5 second generation time

      res.json(video);
    } catch (error) {
      res.status(400).json({ message: "Invalid video generation data" });
    }
  });

  app.get("/api/video-generations/:id", async (req, res) => {
    try {
      const video = await storage.getVideoGeneration(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video generation not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video generation" });
    }
  });

  return httpServer;
}
