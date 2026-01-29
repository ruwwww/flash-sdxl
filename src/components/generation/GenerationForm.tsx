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
import { useState, useEffect } from "react";
import { GenerationJobResponse } from "@/application/dtos/generation.schema";
import { getSystemConfigsAction } from "@/app/actions/config";
import { FeatureConfig } from "@/domain/entities/Config";
import { createClient } from "@/supabase/client";

interface GenerationFormProps {
  onSuccess: (job: GenerationJobResponse) => void;
}

export function GenerationForm({ onSuccess }: GenerationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<FeatureConfig | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
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

  useEffect(() => {
    // Load config and user status
    async function loadConfig() {
      const configRes = await getSystemConfigsAction();
      if (configRes.success) {
        setConfig(configRes.data);
      }

      // Check if user is premium
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_premium, role').eq('id', user.id).single();
        setIsPremium(profile?.is_premium || profile?.role === 'admin' || profile?.role === 'superadmin' || false);
      }
    }
    loadConfig();

    // Load reproduce params from localStorage
    const reproduceParams = localStorage.getItem('reproduceParams');
    if (reproduceParams) {
      try {
        const params = JSON.parse(reproduceParams);
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined) {
            setValue(key as keyof CreateGenerationInput, params[key]);
          }
        });
        localStorage.removeItem('reproduceParams');
      } catch (e) {
        console.error('Failed to parse reproduce params', e);
      }
    }
  }, [setValue]);

  const steps = watch('steps');
  const cfg = watch('cfg');

  const allowCustomResolutions = config && (
    config.custom_resolutions === 'enabled' || 
    (config.custom_resolutions === 'premium' && isPremium)
  );

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

          {/* Dimensions */}
          <div className="space-y-2">
            <Label>Resolution</Label>
            {allowCustomResolutions ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width" className="text-sm">Width</Label>
                  <select 
                    id="width"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("width", { valueAsNumber: true })}
                  >
                    <option value={512}>512</option>
                    <option value={768}>768</option>
                    <option value={832}>832</option>
                    <option value={896}>896</option>
                    <option value={1024}>1024</option>
                    <option value={1152}>1152</option>
                    <option value={1216}>1216</option>
                    <option value={1536}>1536</option>
                  </select>
                  {errors.width && <span className="text-destructive text-sm">{errors.width.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-sm">Height</Label>
                  <select 
                    id="height"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("height", { valueAsNumber: true })}
                  >
                    <option value={512}>512</option>
                    <option value={768}>768</option>
                    <option value={832}>832</option>
                    <option value={896}>896</option>
                    <option value={1024}>1024</option>
                    <option value={1152}>1152</option>
                    <option value={1216}>1216</option>
                    <option value={1536}>1536</option>
                  </select>
                  {errors.height && <span className="text-destructive text-sm">{errors.height.message}</span>}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '1024x1024') {
                      setValue("width", 1024);
                      setValue("height", 1024);
                    } else if (value === '832x1216') {
                      setValue("width", 832);
                      setValue("height", 1216);
                    } else if (value === '1216x832') {
                      setValue("width", 1216);
                      setValue("height", 832);
                    }
                  }}
                >
                  <option value="1024x1024">1024x1024 (Square)</option>
                  <option value="832x1216">832x1216 (Portrait)</option>
                  <option value="1216x832">1216x832 (Landscape)</option>
                </select>
                <input type="hidden" {...register("width", { valueAsNumber: true })} />
                <input type="hidden" {...register("height", { valueAsNumber: true })} />
              </div>
            )}
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

          {/* Batch Size */}
          <div className="space-y-2">
            <Label htmlFor="batch_size">Batch Size</Label>
            <select 
              id="batch_size"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("batch_size", { valueAsNumber: true })}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
            {errors.batch_size && <span className="text-destructive text-sm">{errors.batch_size.message}</span>}
          </div>
          
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
