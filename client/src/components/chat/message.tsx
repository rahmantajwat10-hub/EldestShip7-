import { Button } from "@/components/ui/button";
import { Bot, User, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageProps {
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  attachments?: any[];
}

export default function Message({ content, role, timestamp }: MessageProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex gap-4 mb-6 message-fade-in" data-testid={`message-${role}`}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        role === "assistant" ? "bg-primary" : "bg-muted"
      )}>
        {role === "assistant" ? (
          <Bot className="w-4 h-4 text-primary-foreground" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>
      
      <div className="flex-1">
        <div className={cn(
          "rounded-lg px-4 py-3",
          role === "assistant" ? "bg-card border border-border" : "bg-secondary"
        )}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {content.split('\n').map((line, index) => (
              <p key={index} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-4">
          <span data-testid="text-timestamp">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
          
          {role === "assistant" && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 hover:text-primary"
                data-testid="button-thumbs-up"
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 hover:text-primary"
                data-testid="button-thumbs-down"
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 hover:text-primary"
                onClick={handleCopy}
                data-testid="button-copy"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
