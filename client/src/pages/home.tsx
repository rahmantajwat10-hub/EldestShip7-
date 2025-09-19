import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ChatInterface from "@/components/chat/chat-interface";
import VideoGenerator from "@/components/video/video-generator";
import StudentCorner from "@/components/student/student-corner";

type TabType = "chat" | "video" | "student";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col">
        <Header onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {activeTab === "chat" && <ChatInterface />}
        {activeTab === "video" && <VideoGenerator />}
        {activeTab === "student" && <StudentCorner />}
      </div>
    </div>
  );
}
