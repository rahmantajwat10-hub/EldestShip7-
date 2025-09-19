import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wand2, Upload, Play, Edit, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Flashcards() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: flashcardSets = [] } = useQuery({
    queryKey: ["/api/flashcard-sets"],
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: async (data: { content: string; subject: string; count: number }) => {
      const response = await apiRequest("POST", "/api/flashcards/generate", data);
      return response.json();
    },
    onSuccess: (flashcards) => {
      if (flashcards.length > 0) {
        toast({
          title: "Flashcards Generated",
          description: `Generated ${flashcards.length} flashcards successfully.`,
        });
        // Here you would typically create a flashcard set and add these cards
        setContent("");
        setSubject("");
      }
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSetMutation = useMutation({
    mutationFn: async (data: { title: string; subject: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/flashcard-sets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcard-sets"] });
      toast({
        title: "Set Created",
        description: "New flashcard set created successfully.",
      });
    },
  });

  const handleGenerate = () => {
    if (!content.trim() || !subject.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both subject and content.",
        variant: "destructive",
      });
      return;
    }

    generateFlashcardsMutation.mutate({
      content: content.trim(),
      subject: subject.trim(),
      count: 5
    });
  };

  const handleCreateSet = () => {
    if (!subject.trim()) {
      toast({
        title: "Missing Subject",
        description: "Please enter a subject for the flashcard set.",
        variant: "destructive",
      });
      return;
    }

    createSetMutation.mutate({
      title: subject.trim(),
      subject: subject.trim(),
      description: `Generated from content: ${content.slice(0, 100)}...`
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Flashcard Creator */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Flashcards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject/Topic</label>
              <Input
                placeholder="e.g., Machine Learning Basics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                data-testid="input-subject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Content Input</label>
              <Textarea
                placeholder="Paste your study material here or describe the topic..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-24"
                data-testid="textarea-content"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleGenerate}
                disabled={generateFlashcardsMutation.isPending}
                data-testid="button-generate-flashcards"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateFlashcardsMutation.isPending ? "Generating..." : "Generate Flashcards"}
              </Button>
              <Button 
                variant="outline"
                data-testid="button-upload"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>

            {/* Sample Flashcard */}
            <div className="bg-secondary rounded-lg p-4">
              <div className="flashcard-container">
                <div className="cursor-pointer" onClick={() => setShowAnswer(!showAnswer)}>
                  {!showAnswer ? (
                    <div>
                      <h4 className="font-semibold mb-2">What is supervised learning?</h4>
                      <p className="text-sm text-muted-foreground">Click to reveal answer</p>
                    </div>
                  ) : (
                    <div>
                      <p>Supervised learning is a type of machine learning where the algorithm learns from labeled training data to make predictions on new, unseen data.</p>
                      <p className="text-sm text-muted-foreground mt-2">Click to show question</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-red-500 hover:bg-red-600 text-white"
                    data-testid="button-difficulty-hard"
                  >
                    Hard
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    data-testid="button-difficulty-medium"
                  >
                    Medium
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600 text-white"
                    data-testid="button-difficulty-easy"
                  >
                    Easy
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" data-testid="button-edit-card">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid="button-delete-card">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flashcard Sets */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Your Sets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flashcardSets.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm mb-4">No flashcard sets yet</p>
                <Button 
                  onClick={handleCreateSet}
                  disabled={!subject.trim()}
                  data-testid="button-create-first-set"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Set
                </Button>
              </div>
            ) : (
              flashcardSets.map((set: any) => (
                <div
                  key={set.id}
                  className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                  data-testid={`flashcard-set-${set.id}`}
                >
                  <h4 className="font-medium mb-1">{set.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {set.subject} • Last studied {new Date(set.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <Badge className="text-xs bg-green-500 text-white">
                      0% mastered
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            <Button 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleCreateSet}
              disabled={!subject.trim()}
              data-testid="button-create-new-set"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Set
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
