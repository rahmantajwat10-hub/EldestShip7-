import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: any[]) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // In a real app, you'd upload these files and get URLs back
    console.log("Files selected:", files);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="relative">
          <div className="flex items-end gap-3 bg-secondary rounded-2xl p-3">
            {/* File Upload */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-muted-foreground hover:text-foreground"
              onClick={handleFileUpload}
              data-testid="button-file-upload"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* Text Input */}
            <Textarea
              ref={textareaRef}
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none resize-none min-h-[2.5rem] max-h-32 leading-6 focus-visible:ring-0"
              rows={1}
              data-testid="textarea-message"
            />

            {/* Send Button */}
            <Button
              className="bg-primary text-primary-foreground p-2 rounded-xl hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={!message.trim()}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Press / for commands</span>
              <span>Shift + Enter for new line</span>
            </div>
            <div className="flex items-center gap-2">
              <span data-testid="text-token-count">
                {message.length} characters
              </span>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,application/pdf,.txt,.doc,.docx"
      />
    </div>
  );
}
