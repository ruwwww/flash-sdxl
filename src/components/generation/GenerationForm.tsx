'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateGenerationSchema, CreateGenerationInput } from "@/application/dtos/generation.schema";
import { generateImageAction } from "@/app/actions/generation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { GenerationJobResponse } from "@/application/dtos/generation.schema";

interface GenerationFormProps {
  onSuccess: (job: GenerationJobResponse) => void;
}

export function GenerationForm({ onSuccess }: GenerationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<CreateGenerationInput>({
    resolver: zodResolver(CreateGenerationSchema),
    defaultValues: {
      prompt: "A futuristic cityscape with neon lights, cyberpunk style, high detail, 8k",
      negative_prompt: "blurry, low quality, ugly, deformed",
      width: 1024,
      height: 1024,
      steps: 30,
      cfg: 7,
      batch_size: 1
    }
  });

  const steps = watch('steps');
  const cfg = watch('cfg');

  const onSubmit = async (data: CreateGenerationInput) => {
    setError(null);
    const result = await generateImageAction(data);
    
    if (result.success) {
      onSuccess(result.data);
    } else {
      setError(result.error || "An unknown error occurred");
    }
  };

  return (
    <Card className="w-full h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Generate Params</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <form id="gen-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea 
              id="prompt" 
              placeholder="Describe your image..." 
              className="min-h-[100px]"
              {...register("prompt")}
            />
            {errors.prompt && <span className="text-destructive text-sm">{errors.prompt.message}</span>}
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <Label htmlFor="negative_prompt">Negative Prompt</Label>
            <Input 
              id="negative_prompt" 
              placeholder="What to avoid..." 
              {...register("negative_prompt")}
            />
          </div>

          {/* Dimensions (Simplified as Grid for MVP) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("width", { valueAsNumber: true })}
              >
                <option value={1024}>1024</option>
                <option value={896}>896</option>
                <option value={768}>768</option>
                <option value={512}>512</option>
              </select>
            </div>
            <div className="space-y-2">
               <Label>Height</Label>
               <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("height", { valueAsNumber: true })}
              >
                <option value={1024}>1024</option>
                <option value={1152}>1152</option>
                <option value={768}>768</option>
                <option value={512}>512</option>
              </select>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Steps</Label>
              <span className="text-xs text-muted-foreground">{steps}</span>
            </div>
            <Slider 
              min={10} 
              max={50} 
              step={1} 
              {...register("steps", { valueAsNumber: true })} 
            />
          </div>

          {/* CFG */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Guidance Scale (CFG)</Label>
              <span className="text-xs text-muted-foreground">{cfg}</span>
            </div>
            <Slider 
              min={1} 
              max={20} 
              step={0.5} 
              {...register("cfg", { valueAsNumber: true })} 
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          
        </form>
      </CardContent>
      <CardFooter className="px-0">
        <Button 
          type="submit" 
          form="gen-form" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Generating..." : "Generate"}
        </Button>
      </CardFooter>
    </Card>
  );
}
