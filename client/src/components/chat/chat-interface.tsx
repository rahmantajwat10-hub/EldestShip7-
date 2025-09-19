import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Message from "./message";
import ChatInput from "./chat-input";
import { Bot, User } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";

export default function ChatInterface() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    enabled: !!currentConversationId,
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
  });

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      
      if (data.type === "typing") {
        setIsTyping(data.isTyping);
      } else if (data.type === "message") {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations", currentConversationId, "messages"] 
        });
      }
    }
  }, [lastMessage, queryClient, currentConversationId]);

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!currentConversationId) {
      // Create new conversation
      await createConversationMutation.mutateAsync({
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        model: "gpt-5"
      });
      return;
    }

    if (connectionStatus === "Open") {
      sendMessage({
        type: "chat_message",
        conversationId: currentConversationId,
        content,
        role: "user",
        model: "gpt-5",
        attachments
      });
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
  };

  if (!currentConversationId && conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Welcome Screen */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-2xl text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4" data-testid="text-welcome-title">
              Welcome to NexusAI
            </h2>
            <p className="text-muted-foreground text-lg mb-8" data-testid="text-welcome-description">
              Your advanced AI assistant with video generation and study tools
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <Card className="p-4 hover:bg-card/80 transition-colors cursor-pointer">
                <h3 className="font-semibold mb-2">💡 Ask Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Get help with coding, writing, research, and more
                </p>
              </Card>
              
              <Card className="p-4 hover:bg-card/80 transition-colors cursor-pointer">
                <h3 className="font-semibold mb-2">🎥 Generate Videos</h3>
                <p className="text-sm text-muted-foreground">
                  Create stunning videos with AI-powered generation
                </p>
              </Card>
              
              <Card className="p-4 hover:bg-card/80 transition-colors cursor-pointer">
                <h3 className="font-semibold mb-2">📚 Study Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Flashcards, notes, and quizzes to enhance learning
                </p>
              </Card>
              
              <Card className="p-4 hover:bg-card/80 transition-colors cursor-pointer">
                <h3 className="font-semibold mb-2">🚀 Multi-Model</h3>
                <p className="text-sm text-muted-foreground">
                  Switch between GPT, Claude, and other AI models
                </p>
              </Card>
            </div>
          </div>
        </div>

        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {currentConversationId && (
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold" data-testid="text-conversation-title">
                {conversations.find((c: any) => c.id === currentConversationId)?.title || "New Conversation"}
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNewChat}
                data-testid="button-new-conversation"
              >
                New Chat
              </Button>
            </div>
          )}

          {messages.map((message: any) => (
            <Message
              key={message.id}
              content={message.content}
              role={message.role}
              timestamp={message.createdAt}
              attachments={message.attachments}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 message-fade-in">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-lg px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
