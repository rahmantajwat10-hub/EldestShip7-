import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: any[];
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export function useChat() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-5");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    enabled: !!currentConversationId,
  });

  // WebSocket connection for real-time messaging
  const { sendJsonMessage, connectionStatus } = useWebSocket({
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "typing") {
          setIsTyping(data.isTyping);
        } else if (data.type === "message") {
          // Invalidate messages query to refetch with new message
          queryClient.invalidateQueries({ 
            queryKey: ["/api/conversations", currentConversationId, "messages"] 
          });
          setIsTyping(false);
          scrollToBottom();
        } else if (data.type === "error") {
          toast({
            title: "Chat Error",
            description: data.message,
            variant: "destructive",
          });
          setIsTyping(false);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    },
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Lost connection to chat server. Attempting to reconnect...",
        variant: "destructive",
      });
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; model: string }) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationId(newConversation.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new conversation.",
        variant: "destructive",
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (currentConversationId) {
        setCurrentConversationId(null);
      }
      toast({
        title: "Conversation Deleted",
        description: "The conversation has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const sendMessage = useCallback(async (content: string, attachments?: any[]) => {
    if (!content.trim()) return;

    try {
      // Create new conversation if none exists
      if (!currentConversationId) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        await createConversationMutation.mutateAsync({
          title,
          model: selectedModel
        });
        return; // The mutation will set the conversation ID and we can send the message after
      }

      // Send message via WebSocket if connected
      if (connectionStatus === "Open") {
        const success = sendJsonMessage({
          type: "chat_message",
          conversationId: currentConversationId,
          content: content.trim(),
          role: "user",
          model: selectedModel,
          attachments: attachments || null
        });

        if (success) {
          scrollToBottom();
        } else {
          throw new Error("Failed to send message via WebSocket");
        }
      } else {
        throw new Error("WebSocket connection not available");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to Send",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentConversationId, selectedModel, connectionStatus, sendJsonMessage, createConversationMutation, toast, scrollToBottom]);

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setIsTyping(false);
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    setIsTyping(false);
    scrollToBottom();
  }, [scrollToBottom]);

  const deleteConversation = useCallback((conversationId: string) => {
    deleteConversationMutation.mutate(conversationId);
  }, [deleteConversationMutation]);

  // Auto-scroll when new messages arrive
  const currentConversation = conversations.find(conv => conv.id === currentConversationId);

  return {
    // State
    conversations,
    messages,
    currentConversationId,
    currentConversation,
    isTyping,
    selectedModel,
    connectionStatus,
    messagesEndRef,
    
    // Actions
    sendMessage,
    startNewConversation,
    selectConversation,
    deleteConversation,
    setSelectedModel,
    scrollToBottom,
    
    // Loading states
    isCreatingConversation: createConversationMutation.isPending,
    isDeletingConversation: deleteConversationMutation.isPending,
  };
}
