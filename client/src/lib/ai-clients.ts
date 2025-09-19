// AI client utilities for different models
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// The newest Anthropic model is "claude-sonnet-4-20250514"

export const AI_MODELS = {
  OPENAI: {
    GPT_5: "gpt-5",
    GPT_4: "gpt-4o",
  },
  ANTHROPIC: {
    CLAUDE_4: "claude-sonnet-4-20250514",
    CLAUDE_3_5: "claude-3-5-sonnet-20241022",
  },
  GOOGLE: {
    GEMINI_PRO: "gemini-pro",
  }
} as const;

export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  description: string;
  maxTokens: number;
  supportsImages: boolean;
  supportsFiles: boolean;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: AI_MODELS.OPENAI.GPT_5,
    name: "GPT-5",
    provider: "openai",
    description: "Most advanced OpenAI model with exceptional reasoning",
    maxTokens: 128000,
    supportsImages: true,
    supportsFiles: true,
  },
  {
    id: AI_MODELS.OPENAI.GPT_4,
    name: "GPT-4o",
    provider: "openai",
    description: "Fast and capable multimodal model",
    maxTokens: 128000,
    supportsImages: true,
    supportsFiles: true,
  },
  {
    id: AI_MODELS.ANTHROPIC.CLAUDE_4,
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Anthropic's most advanced model",
    maxTokens: 200000,
    supportsImages: true,
    supportsFiles: true,
  },
  {
    id: AI_MODELS.ANTHROPIC.CLAUDE_3_5,
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Excellent for complex reasoning and coding",
    maxTokens: 200000,
    supportsImages: true,
    supportsFiles: true,
  },
  {
    id: AI_MODELS.GOOGLE.GEMINI_PRO,
    name: "Gemini Pro",
    provider: "google",
    description: "Google's multimodal AI model",
    maxTokens: 32000,
    supportsImages: true,
    supportsFiles: true,
  },
];

export function getModelById(modelId: string): AIModel | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AVAILABLE_MODELS.filter(model => model.provider === provider);
}

export function getDefaultModel(): AIModel {
  return AVAILABLE_MODELS[0]; // GPT-5 as default
}

// Token counting utilities
export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token for most models
  return Math.ceil(text.length / 4);
}

export function formatTokenCount(count: number, maxTokens: number): string {
  const percentage = (count / maxTokens) * 100;
  return `${count.toLocaleString()} / ${maxTokens.toLocaleString()} tokens (${percentage.toFixed(1)}%)`;
}

// Message formatting utilities
export interface FormattedMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; image_url?: string }>;
}

export function formatMessageForAPI(content: string, attachments?: any[]): FormattedMessage {
  if (!attachments || attachments.length === 0) {
    return {
      role: "user",
      content: content
    };
  }

  // Handle multimodal messages with attachments
  const contentArray: any[] = [{ type: "text", text: content }];

  attachments.forEach(attachment => {
    if (attachment.mimeType?.startsWith("image/")) {
      contentArray.push({
        type: "image_url",
        image_url: {
          url: attachment.url || `data:${attachment.mimeType};base64,${attachment.data}`
        }
      });
    }
  });

  return {
    role: "user",
    content: contentArray
  };
}

// Error handling utilities
export interface AIError {
  type: "rate_limit" | "invalid_request" | "authentication" | "server_error" | "network_error";
  message: string;
  retryable: boolean;
}

export function parseAIError(error: any): AIError {
  if (error?.response?.status) {
    const status = error.response.status;
    
    if (status === 429) {
      return {
        type: "rate_limit",
        message: "Rate limit exceeded. Please wait before trying again.",
        retryable: true
      };
    } else if (status === 401) {
      return {
        type: "authentication",
        message: "Invalid API key or authentication failed.",
        retryable: false
      };
    } else if (status === 400) {
      return {
        type: "invalid_request",
        message: error.response.data?.error?.message || "Invalid request parameters.",
        retryable: false
      };
    } else if (status >= 500) {
      return {
        type: "server_error",
        message: "Server error occurred. Please try again later.",
        retryable: true
      };
    }
  }

  // Network or other errors
  return {
    type: "network_error",
    message: error.message || "An unexpected error occurred.",
    retryable: true
  };
}

// Prompt templates for different use cases
export const PROMPT_TEMPLATES = {
  SUMMARIZE: "Please summarize the following content concisely while maintaining key points:\n\n",
  EXPLAIN: "Please explain the following concept in simple terms:\n\n",
  CODE_REVIEW: "Please review the following code and suggest improvements:\n\n",
  TRANSLATE: (language: string) => `Please translate the following text to ${language}:\n\n`,
  FLASHCARDS: (count: number) => 
    `Create ${count} flashcards from the following content. Each flashcard should have a clear question on the front and a concise answer on the back. Format as JSON array with objects containing "front" and "back" properties.\n\nContent:\n\n`,
  QUIZ: (difficulty: string, count: number, types: string[]) =>
    `Create a ${difficulty} difficulty quiz with ${count} questions. Question types to include: ${types.join(', ')}.\n\nFormat as JSON with this structure:\n{\n  "title": "Quiz title",\n  "questions": [\n    {\n      "type": "multiple-choice",\n      "question": "Question text",\n      "options": ["A", "B", "C", "D"],\n      "correctAnswer": 0,\n      "explanation": "Why this is correct"\n    }\n  ]\n}\n\nTopic:\n\n`,
};

export function buildPrompt(template: string, content: string): string {
  return template + content;
}
