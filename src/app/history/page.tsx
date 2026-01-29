'use client';

import { useState, useEffect } from "react";
import { getUserJobsAction } from "@/app/actions/generation";
import { GenerationJob } from "@/domain/entities/GenerationJob";
import { GeneratedImageDto } from "@/domain/repositories/IGenerationRepository";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle, XCircle, Play, RotateCcw, Eye, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

export default function HistoryPage() {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [jobImages, setJobImages] = useState<{[key: string]: GeneratedImageDto[]}>({});

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const res = await getUserJobsAction();
    if (res.success) {
      setJobs(res.data);
      // Fetch images for each completed job
      const imagesMap: {[key: string]: GeneratedImageDto[]} = {};
      for (const job of res.data.filter(j => j.status === 'COMPLETED')) {
        // We need to get images for each job
        // For now, we'll fetch them individually
        const imagesRes = await fetch(`/api/jobs/${job.id}/images`);
        if (imagesRes.ok) {
          const images = await imagesRes.json();
          imagesMap[job.id] = images;
        }
      }
      setJobImages(imagesMap);
    }
    setLoading(false);
  }

  const toggleExpanded = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const getStatusIcon = (status: GenerationJob['status']) => {
    switch (status) {
      case 'QUEUED': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PROCESSING': return <Play className="w-4 h-4 text-blue-500" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: GenerationJob['status']) => {
    switch (status) {
      case 'QUEUED': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReproduce = (job: GenerationJob) => {
    // Navigate to generate page with prefilled form
    // For now, we'll use localStorage or URL params
    const params = {
      prompt: job.prompt,
      negative_prompt: job.negativePrompt || '',
      width: job.params.width || 1024,
      height: job.params.height || 1024,
      steps: job.params.steps || 30,
      cfg: job.params.cfg || 7,
      batch_size: job.params.batch_size || 1,
      seed: job.params.seed
    };
    localStorage.setItem('reproduceParams', JSON.stringify(params));
    window.location.href = '/generate';
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl pt-20 pb-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl pt-20 pb-4">
      <h1 className="text-2xl font-bold mb-6">Generation History</h1>
      
      <div className="space-y-6">
        {jobs.map((job) => (
          <Card key={job.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status)}
                <div>
                  <Badge variant="outline" className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {job.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleReproduce(job)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reproduce
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleExpanded(job.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {expandedJobs.has(job.id) ? 'Hide' : 'Details'}
                  {expandedJobs.has(job.id) ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>

            <p className="text-sm mb-4">{job.prompt}</p>

            {expandedJobs.has(job.id) && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Generation Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Status:</strong> {job.status}
                  </div>
                  <div>
                    <strong>Created:</strong> {job.createdAt.toLocaleString()}
                  </div>
                  <div>
                    <strong>Prompt:</strong> {job.prompt}
                  </div>
                  <div>
                    <strong>Negative Prompt:</strong> {job.negativePrompt || 'None'}
                  </div>
                  <div>
                    <strong>Resolution:</strong> {job.params.width || 'N/A'}x{job.params.height || 'N/A'}
                  </div>
                  <div>
                    <strong>Steps:</strong> {job.params.steps || 'N/A'}
                  </div>
                  <div>
                    <strong>CFG:</strong> {job.params.cfg || 'N/A'}
                  </div>
                  <div>
                    <strong>Batch Size:</strong> {job.params.batch_size || 'N/A'}
                  </div>
                  <div>
                    <strong>Seed:</strong> {job.params.seed || 'Random'}
                  </div>
                </div>
                {job.errorMessage && (
                  <div className="text-destructive mt-2">
                    <strong>Error:</strong> {job.errorMessage}
                  </div>
                )}
              </div>
            )}

            {job.status === 'COMPLETED' && jobImages[job.id] && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {jobImages[job.id].map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-black group border border-border/50 cursor-pointer">
                    <Image 
                      src={img.storagePath} 
                      alt={`Seed ${img.seed}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}