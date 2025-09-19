import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, StickyNote, ClipboardList, BarChart3 } from "lucide-react";
import Flashcards from "./flashcards";
import Notes from "./notes";
import QuizGenerator from "./quiz-generator";

export default function StudentCorner() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" data-testid="text-page-title">Student Corner</h2>
          <p className="text-muted-foreground">Enhance your learning with AI-powered study tools</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-flashcards">0</p>
                  <p className="text-sm text-muted-foreground">Flashcards</p>
                </div>
                <Layers className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-accent" data-testid="stat-quiz-sets">0</p>
                  <p className="text-sm text-muted-foreground">Quiz Sets</p>
                </div>
                <ClipboardList className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-500" data-testid="stat-success-rate">0%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-500" data-testid="stat-study-time">0h</p>
                  <p className="text-sm text-muted-foreground">Study Time</p>
                </div>
                <StickyNote className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Tools Tabs */}
        <Tabs defaultValue="flashcards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flashcards" className="flex items-center gap-2" data-testid="tab-flashcards">
              <Layers className="w-4 h-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2" data-testid="tab-notes">
              <StickyNote className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2" data-testid="tab-quiz">
              <ClipboardList className="w-4 h-4" />
              Quiz Generator
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2" data-testid="tab-progress">
              <BarChart3 className="w-4 h-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards">
            <Flashcards />
          </TabsContent>

          <TabsContent value="notes">
            <Notes />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizGenerator />
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
                  <p className="text-muted-foreground">
                    Study progress and analytics will be displayed here as you use the study tools.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
