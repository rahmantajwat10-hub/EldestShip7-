import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function QuizGenerator() {
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [questionTypes, setQuestionTypes] = useState(["multiple-choice"]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quizzes = [] } = useQuery({
    queryKey: ["/api/quizzes"],
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["/api/quiz-attempts"],
  });

  const { data: selectedQuiz } = useQuery({
    queryKey: ["/api/quizzes", selectedQuizId],
    enabled: !!selectedQuizId,
  });

  const generateQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quizzes/generate", data);
      return response.json();
    },
    onSuccess: (newQuiz) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setSelectedQuizId(newQuiz.id);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setQuizCompleted(false);
      toast({
        title: "Quiz Generated",
        description: `Generated a ${difficulty} quiz with ${questionCount} questions.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async ({ quizId, answers }: { quizId: string; answers: any[] }) => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/attempts`, { answers });
      return response.json();
    },
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      setQuizCompleted(true);
      const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
      toast({
        title: "Quiz Completed",
        description: `You scored ${attempt.score}/${attempt.totalQuestions} (${percentage}%)`,
      });
    },
  });

  const handleGenerate = () => {
    if (!subject.trim()) {
      toast({
        title: "Missing Subject",
        description: "Please enter a subject for the quiz.",
        variant: "destructive",
      });
      return;
    }

    generateQuizMutation.mutate({
      subject: subject.trim(),
      difficulty,
      questionCount: parseInt(questionCount),
      questionTypes
    });
  };

  const handleQuestionTypeToggle = (type: string, checked: boolean) => {
    if (checked) {
      setQuestionTypes([...questionTypes, type]);
    } else {
      setQuestionTypes(questionTypes.filter(t => t !== type));
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: any) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (selectedQuiz && currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!selectedQuizId) return;
    
    submitQuizMutation.mutate({
      quizId: selectedQuizId,
      answers: userAnswers
    });
  };

  const startNewQuiz = () => {
    setSelectedQuizId(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
  };

  const currentQuestion = selectedQuiz?.questions?.[currentQuestionIndex];
  const isLastQuestion = selectedQuiz && currentQuestionIndex === selectedQuiz.questions.length - 1;
  const hasAnsweredAll = selectedQuiz && userAnswers.length === selectedQuiz.questions.length && 
    userAnswers.every(answer => answer !== undefined && answer !== null);

  if (selectedQuiz && !quizCompleted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold" data-testid="text-quiz-title">{selectedQuiz.title}</h3>
            <p className="text-muted-foreground">
              Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
            </p>
          </div>
          <Button variant="outline" onClick={startNewQuiz} data-testid="button-start-new-quiz">
            Start New Quiz
          </Button>
        </div>

        <Card>
          <CardContent className="p-8">
            {currentQuestion && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-4" data-testid="text-question">
                    {currentQuestion.question}
                  </h4>
                  
                  {currentQuestion.type === "multiple-choice" && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option: string, index: number) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                          data-testid={`option-${index}`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestionIndex}`}
                            value={index}
                            checked={userAnswers[currentQuestionIndex] === index}
                            onChange={() => handleAnswerSelect(currentQuestionIndex, index)}
                            className="w-4 h-4"
                          />
                          <span className="flex-1">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === "true-false" && (
                    <div className="space-y-3">
                      {["True", "False"].map((option, index) => (
                        <label
                          key={option}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                          data-testid={`option-${option.toLowerCase()}`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestionIndex}`}
                            value={index}
                            checked={userAnswers[currentQuestionIndex] === index}
                            onChange={() => handleAnswerSelect(currentQuestionIndex, index)}
                            className="w-4 h-4"
                          />
                          <span className="flex-1">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    {selectedQuiz.questions.map((_: any, index: number) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full ${
                          index === currentQuestionIndex 
                            ? 'bg-primary' 
                            : userAnswers[index] !== undefined 
                              ? 'bg-green-500' 
                              : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={!hasAnsweredAll || submitQuizMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      data-testid="button-submit-quiz"
                    >
                      {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      disabled={userAnswers[currentQuestionIndex] === undefined}
                      data-testid="button-next"
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quiz Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Topic or Subject</label>
            <Input
              placeholder="e.g., Machine Learning"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="input-quiz-subject"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger data-testid="select-question-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 questions</SelectItem>
                  <SelectItem value="10">10 questions</SelectItem>
                  <SelectItem value="15">15 questions</SelectItem>
                  <SelectItem value="20">20 questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Question Types</label>
            <div className="space-y-2">
              {[
                { id: "multiple-choice", label: "Multiple Choice" },
                { id: "true-false", label: "True/False" },
                { id: "short-answer", label: "Short Answer" }
              ].map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={questionTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleQuestionTypeToggle(type.id, !!checked)}
                    data-testid={`checkbox-${type.id}`}
                  />
                  <label htmlFor={type.id} className="text-sm">
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
            onClick={handleGenerate}
            disabled={generateQuizMutation.isPending || questionTypes.length === 0}
            data-testid="button-generate-quiz"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            {generateQuizMutation.isPending ? "Generating..." : "Generate Quiz"}
          </Button>
        </CardContent>
      </Card>

      {/* Quiz History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quizzes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quizAttempts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">No quiz attempts yet</p>
            </div>
          ) : (
            quizAttempts.slice(0, 5).map((attempt: any) => {
              const quiz = quizzes.find((q: any) => q.id === attempt.quizId);
              const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
              
              return (
                <div key={attempt.id} className="p-4 bg-secondary rounded-lg" data-testid={`quiz-attempt-${attempt.id}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{quiz?.title || "Unknown Quiz"}</h4>
                    <Badge className={`${
                      percentage >= 80 ? 'bg-green-500' : 
                      percentage >= 60 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    } text-white`}>
                      {percentage}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {attempt.totalQuestions} questions • {attempt.score} correct • 
                    Completed {new Date(attempt.completedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Review
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedQuizId(quiz?.id)}
                      disabled={!quiz}
                    >
                      Retake
                    </Button>
                  </div>
                </div>
              );
            })
          )}

          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            data-testid="button-view-all-quizzes"
          >
            <Plus className="w-4 h-4 mr-2" />
            View All Quizzes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
