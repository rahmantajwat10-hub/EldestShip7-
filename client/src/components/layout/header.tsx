import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Share, Download, Settings } from "lucide-react";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const [selectedModel, setSelectedModel] = useState("gpt-5");

  const models = [
    { value: "gpt-5", label: "GPT-5" },
    { value: "claude-sonnet-4", label: "Claude Sonnet 4" },
    { value: "gemini-pro", label: "Gemini Pro" },
  ];

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onSidebarToggle}
            data-testid="button-sidebar-toggle"
          >
            <Menu className="w-4 h-4" />
          </Button>
          
          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Model:</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40" data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            data-testid="button-share"
          >
            <Share className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            data-testid="button-download"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
