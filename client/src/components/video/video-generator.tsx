import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Wand2, Play, Download, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("10");
  const [style, setStyle] = useState("realistic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [motionIntensity, setMotionIntensity] = useState([5]);
  const [cameraMovement, setCameraMovement] = useState([3]);
  const [colorSaturation, setColorSaturation] = useState([7]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: videoGenerations = [] } = useQuery({
    queryKey: ["/api/video-generations"],
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/video-generations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-generations"] });
      toast({
        title: "Video Generation Started",
        description: "Your video is being generated. This may take a few minutes.",
      });
      setPrompt("");
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to start video generation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter a video prompt.",
        variant: "destructive",
      });
      return;
    }

    generateVideoMutation.mutate({
      prompt: prompt.trim(),
      duration: parseInt(duration),
      style,
      aspectRatio,
    });
  };

  const durations = [
    { value: "5", label: "5 seconds" },
    { value: "10", label: "10 seconds" },
    { value: "15", label: "15 seconds" },
    { value: "30", label: "30 seconds" },
  ];

  const styles = [
    { value: "realistic", label: "Realistic" },
    { value: "animated", label: "Animated" },
    { value: "cinematic", label: "Cinematic" },
    { value: "abstract", label: "Abstract" },
  ];

  const aspectRatios = [
    { value: "16:9", label: "16:9" },
    { value: "9:16", label: "9:16" },
    { value: "1:1", label: "1:1" },
  ];

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" data-testid="text-page-title">Video Generation Studio</h2>
          <p className="text-muted-foreground">Create stunning videos with AI-powered generation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Creation Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-accent" />
                  Create New Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Video Prompt</label>
                  <Textarea
                    placeholder="Describe the video you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-24"
                    data-testid="textarea-prompt"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Duration</label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Style</label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger data-testid="select-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {aspectRatios.map((ratio) => (
                      <Button
                        key={ratio.value}
                        variant={aspectRatio === ratio.value ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setAspectRatio(ratio.value)}
                        data-testid={`button-aspect-${ratio.value}`}
                      >
                        {ratio.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
                  onClick={handleGenerate}
                  disabled={generateVideoMutation.isPending}
                  data-testid="button-generate"
                >
                  <Video className="w-4 h-4 mr-2" />
                  {generateVideoMutation.isPending ? "Generating..." : "Generate Video"}
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Options */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Motion Intensity</span>
                    <span className="text-sm text-muted-foreground">{motionIntensity[0]}</span>
                  </div>
                  <Slider
                    value={motionIntensity}
                    onValueChange={setMotionIntensity}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Camera Movement</span>
                    <span className="text-sm text-muted-foreground">{cameraMovement[0]}</span>
                  </div>
                  <Slider
                    value={cameraMovement}
                    onValueChange={setCameraMovement}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Color Saturation</span>
                    <span className="text-sm text-muted-foreground">{colorSaturation[0]}</span>
                  </div>
                  <Slider
                    value={colorSaturation}
                    onValueChange={setColorSaturation}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & History */}
          <div className="space-y-6">
            {/* Current Generation */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-muted-foreground mb-2 mx-auto" />
                    <p className="text-muted-foreground">Video preview will appear here</p>
                  </div>
                </div>
                
                {generateVideoMutation.isPending && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Generating...</span>
                      <span className="text-sm text-muted-foreground">Processing</span>
                    </div>
                    <Progress value={33} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Videos */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {videoGenerations.slice(0, 5).map((video: any) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                      data-testid={`video-${video.id}`}
                    >
                      <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                        <Play className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{video.prompt}</p>
                        <p className="text-xs text-muted-foreground">
                          {video.duration}s • {video.style} • {video.status}
                        </p>
                      </div>
                      {video.status === "completed" && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {videoGenerations.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">No videos generated yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
