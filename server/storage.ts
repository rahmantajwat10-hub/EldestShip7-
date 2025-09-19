import { 
  type User, type InsertUser, type Conversation, type InsertConversation,
  type Message, type InsertMessage, type FlashcardSet, type InsertFlashcardSet,
  type Flashcard, type InsertFlashcard, type Note, type InsertNote,
  type Quiz, type InsertQuiz, type QuizAttempt, type InsertQuizAttempt,
  type VideoGeneration, type InsertVideoGeneration
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conversations
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;

  // Messages
  getConversationMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Flashcards
  getUserFlashcardSets(userId: string): Promise<FlashcardSet[]>;
  getFlashcardSet(id: string): Promise<FlashcardSet | undefined>;
  createFlashcardSet(set: InsertFlashcardSet): Promise<FlashcardSet>;
  updateFlashcardSet(id: string, updates: Partial<FlashcardSet>): Promise<FlashcardSet>;
  deleteFlashcardSet(id: string): Promise<void>;
  
  getSetFlashcards(setId: string): Promise<Flashcard[]>;
  createFlashcard(card: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard>;
  deleteFlashcard(id: string): Promise<void>;

  // Notes
  getUserNotes(userId: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  // Quizzes
  getUserQuizzes(userId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;

  // Quiz Attempts
  getQuizAttempts(quizId: string): Promise<QuizAttempt[]>;
  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;

  // Video Generation
  getUserVideoGenerations(userId: string): Promise<VideoGeneration[]>;
  getVideoGeneration(id: string): Promise<VideoGeneration | undefined>;
  createVideoGeneration(video: InsertVideoGeneration): Promise<VideoGeneration>;
  updateVideoGeneration(id: string, updates: Partial<VideoGeneration>): Promise<VideoGeneration>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();
  private flashcardSets: Map<string, FlashcardSet> = new Map();
  private flashcards: Map<string, Flashcard> = new Map();
  private notes: Map<string, Note> = new Map();
  private quizzes: Map<string, Quiz> = new Map();
  private quizAttempts: Map<string, QuizAttempt> = new Map();
  private videoGenerations: Map<string, VideoGeneration> = new Map();

  constructor() {
    // Create a default user for demo purposes
    const defaultUser: User = {
      id: "default-user",
      username: "demo",
      password: "demo",
      email: "demo@nexusai.com",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => (b.updatedAt || b.createdAt)!.getTime() - (a.updatedAt || a.createdAt)!.getTime());
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = { 
      ...insertConversation, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const existing = this.conversations.get(id);
    if (!existing) throw new Error("Conversation not found");
    
    const updated: Conversation = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
    // Also delete associated messages
    Array.from(this.messages.keys()).forEach(key => {
      const message = this.messages.get(key);
      if (message?.conversationId === id) {
        this.messages.delete(key);
      }
    });
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }

  async getUserFlashcardSets(userId: string): Promise<FlashcardSet[]> {
    return Array.from(this.flashcardSets.values())
      .filter(set => set.userId === userId)
      .sort((a, b) => (b.updatedAt || b.createdAt)!.getTime() - (a.updatedAt || a.createdAt)!.getTime());
  }

  async getFlashcardSet(id: string): Promise<FlashcardSet | undefined> {
    return this.flashcardSets.get(id);
  }

  async createFlashcardSet(insertSet: InsertFlashcardSet): Promise<FlashcardSet> {
    const id = randomUUID();
    const now = new Date();
    const set: FlashcardSet = { 
      ...insertSet, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.flashcardSets.set(id, set);
    return set;
  }

  async updateFlashcardSet(id: string, updates: Partial<FlashcardSet>): Promise<FlashcardSet> {
    const existing = this.flashcardSets.get(id);
    if (!existing) throw new Error("Flashcard set not found");
    
    const updated: FlashcardSet = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.flashcardSets.set(id, updated);
    return updated;
  }

  async deleteFlashcardSet(id: string): Promise<void> {
    this.flashcardSets.delete(id);
    // Also delete associated flashcards
    Array.from(this.flashcards.keys()).forEach(key => {
      const card = this.flashcards.get(key);
      if (card?.setId === id) {
        this.flashcards.delete(key);
      }
    });
  }

  async getSetFlashcards(setId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values())
      .filter(card => card.setId === setId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  async createFlashcard(insertCard: InsertFlashcard): Promise<Flashcard> {
    const id = randomUUID();
    const card: Flashcard = { 
      ...insertCard, 
      id, 
      difficulty: insertCard.difficulty || 1,
      reviewCount: 0,
      masteryLevel: 0,
      lastReviewed: null,
      createdAt: new Date() 
    };
    this.flashcards.set(id, card);
    return card;
  }

  async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard> {
    const existing = this.flashcards.get(id);
    if (!existing) throw new Error("Flashcard not found");
    
    const updated: Flashcard = { ...existing, ...updates };
    this.flashcards.set(id, updated);
    return updated;
  }

  async deleteFlashcard(id: string): Promise<void> {
    this.flashcards.delete(id);
  }

  async getUserNotes(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => (b.updatedAt || b.createdAt)!.getTime() - (a.updatedAt || a.createdAt)!.getTime());
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const now = new Date();
    const note: Note = { 
      ...insertNote, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const existing = this.notes.get(id);
    if (!existing) throw new Error("Note not found");
    
    const updated: Note = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
  }

  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values())
      .filter(quiz => quiz.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = { 
      ...insertQuiz, 
      id, 
      createdAt: new Date() 
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    this.quizzes.delete(id);
    // Also delete associated attempts
    Array.from(this.quizAttempts.keys()).forEach(key => {
      const attempt = this.quizAttempts.get(key);
      if (attempt?.quizId === id) {
        this.quizAttempts.delete(key);
      }
    });
  }

  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.quizId === quizId)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  }

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.userId === userId)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  }

  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    const attempt: QuizAttempt = { 
      ...insertAttempt, 
      id, 
      completedAt: new Date() 
    };
    this.quizAttempts.set(id, attempt);
    return attempt;
  }

  async getUserVideoGenerations(userId: string): Promise<VideoGeneration[]> {
    return Array.from(this.videoGenerations.values())
      .filter(video => video.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getVideoGeneration(id: string): Promise<VideoGeneration | undefined> {
    return this.videoGenerations.get(id);
  }

  async createVideoGeneration(insertVideo: InsertVideoGeneration): Promise<VideoGeneration> {
    const id = randomUUID();
    const video: VideoGeneration = { 
      ...insertVideo, 
      id, 
      status: "pending",
      videoUrl: null,
      thumbnailUrl: null,
      completedAt: null,
      createdAt: new Date() 
    };
    this.videoGenerations.set(id, video);
    return video;
  }

  async updateVideoGeneration(id: string, updates: Partial<VideoGeneration>): Promise<VideoGeneration> {
    const existing = this.videoGenerations.get(id);
    if (!existing) throw new Error("Video generation not found");
    
    const updated: VideoGeneration = { ...existing, ...updates };
    this.videoGenerations.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
