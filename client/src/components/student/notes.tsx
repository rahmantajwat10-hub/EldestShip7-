import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Wand2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Notes() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notes = [] } = useQuery({
    queryKey: ["/api/notes"],
  });

  const { data: selectedNote } = useQuery({
    queryKey: ["/api/notes", selectedNoteId],
    enabled: !!selectedNoteId,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; subject?: string }) => {
      const response = await apiRequest("POST", "/api/notes", data);
      return response.json();
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setSelectedNoteId(newNote.id);
      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully.",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/notes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes", selectedNoteId] });
      toast({
        title: "Note Updated",
        description: "Your note has been updated successfully.",
      });
    },
  });

  const enhanceNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiRequest("POST", `/api/notes/${noteId}/enhance`);
      return response.json();
    },
    onSuccess: (enhancedNote) => {
      setContent(enhancedNote.content);
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes", selectedNoteId] });
      toast({
        title: "Note Enhanced",
        description: "Your note has been enhanced with AI improvements.",
      });
    },
    onError: () => {
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both title and content.",
        variant: "destructive",
      });
      return;
    }

    if (selectedNoteId) {
      updateNoteMutation.mutate({
        id: selectedNoteId,
        data: { title: title.trim(), content: content.trim(), subject: subject.trim() || undefined }
      });
    } else {
      createNoteMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        subject: subject.trim() || undefined
      });
    }
  };

  const handleEnhance = () => {
    if (!selectedNoteId) {
      toast({
        title: "Save Note First",
        description: "Please save your note before enhancing it.",
        variant: "destructive",
      });
      return;
    }

    enhanceNoteMutation.mutate(selectedNoteId);
  };

  const selectNote = (note: any) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSubject(note.subject || "");
  };

  const createNewNote = () => {
    setSelectedNoteId(null);
    setTitle("");
    setContent("");
    setSubject("");
  };

  // Load selected note data when it changes
  if (selectedNote && selectedNote.id === selectedNoteId) {
    if (title !== selectedNote.title || content !== selectedNote.content) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setSubject(selectedNote.subject || "");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Note Editor */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Smart Notes</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSave}
                  disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {createNoteMutation.isPending || updateNoteMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button 
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleEnhance}
                  disabled={enhanceNoteMutation.isPending || !selectedNoteId}
                  data-testid="button-enhance"
                >
                  <Wand2 className="w-4 h-4 mr-1" />
                  {enhanceNoteMutation.isPending ? "Enhancing..." : "AI Enhance"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-semibold"
              data-testid="input-note-title"
            />
            
            <Input
              placeholder="Subject (optional)..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="input-note-subject"
            />
            
            <Textarea
              placeholder="Start writing your notes here... AI will help with grammar, clarity, and organization."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-96 resize-none"
              data-testid="textarea-note-content"
            />
            
            {!content && (
              <div className="text-muted-foreground text-sm bg-muted p-4 rounded-lg">
                <p className="mb-4">Start writing your notes here... AI will help with:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Grammar and clarity improvements</li>
                  <li>Key concept extraction</li>
                  <li>Related topic suggestions</li>
                  <li>Summary generation</li>
                  <li>Automatic flashcard creation</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Sidebar */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Notes</CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={createNewNote}
                data-testid="button-new-note"
              >
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">No notes yet</p>
              </div>
            ) : (
              notes.slice(0, 10).map((note: any) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    selectedNoteId === note.id ? 'bg-primary/20' : 'bg-secondary hover:bg-secondary/80'
                  }`}
                  onClick={() => selectNote(note)}
                  data-testid={`note-${note.id}`}
                >
                  <h4 className="font-medium mb-1 truncate">{note.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {note.subject && `${note.subject} • `}
                    Modified {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
