import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, MessageCircle, Video, GraduationCap, User, MoreVertical } from "lucide-react";

interface SidebarProps {
  activeTab: "chat" | "video" | "student";
  onTabChange: (tab: "chat" | "video" | "student") => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ activeTab, onTabChange, isOpen }: SidebarProps) {
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const navItems = [
    { id: "chat" as const, icon: MessageCircle, label: "Chat", color: "text-primary" },
    { id: "video" as const, icon: Video, label: "Video Generation", color: "text-accent" },
    { id: "student" as const, icon: GraduationCap, label: "Student Corner", color: "text-green-500" },
  ];

  return (
    <div className={cn(
      "w-64 bg-card border-r border-border flex flex-col transition-all duration-300",
      !isOpen && "hidden lg:flex"
    )}>
      {/* Logo/Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold gradient-text" data-testid="logo-title">NexusAI</h1>
        <p className="text-sm text-muted-foreground">Advanced AI Assistant</p>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start px-3 py-2 h-auto",
                activeTab === item.id && "bg-secondary text-foreground"
              )}
              onClick={() => onTabChange(item.id)}
              data-testid={`button-nav-${item.id}`}
            >
              <item.icon className={cn("w-4 h-4 mr-3", item.color)} />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Recent Conversations */}
        <div className="mt-6">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Recent Chats
          </h3>
          <div className="space-y-1">
            {conversations.slice(0, 5).map((conversation: any) => (
              <div
                key={conversation.id}
                className="px-3 py-2 text-sm rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                data-testid={`conversation-${conversation.id}`}
              >
                <div className="font-medium truncate">{conversation.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {conversation.model} • {new Date(conversation.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate" data-testid="text-username">Demo User</div>
            <div className="text-xs text-muted-foreground">Premium Plan</div>
          </div>
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
