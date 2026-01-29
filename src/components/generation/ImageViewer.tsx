'use client';

import { useEffect, useState } from "react";
import { getJobStatusAction } from "@/app/actions/generation";
import { JobStatusOutput } from "@/application/use-cases/generation/GetGenerationStatus";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageViewerProps {
  jobId: string | null;
  onCompleted?: () => void;
}

export function ImageViewer({ jobId, onCompleted }: ImageViewerProps) {
  const [status, setStatus] = useState<JobStatusOutput | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 2000); // Poll every 2s

    function fetchStatus() {
       getJobStatusAction(jobId!)
         .then((res) => {
            if (res.success) {
               setStatus(res.data);
               if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
                 clearInterval(interval);
                 setLoading(false);
                 if (res.data.status === 'COMPLETED' && onCompleted) {
                    onCompleted();
                 }
               }
            }
         });
    }

    return () => clearInterval(interval);
  }, [jobId]);

  if (!jobId) {
    return (
      <Card className="w-full h-full min-h-[500px] flex items-center justify-center bg-muted/20 border-dashed">
         <div className="text-muted-foreground text-center">
            <p>Ready to generate.</p>
            <p className="text-sm">Configure your parameters and hit Generate.</p>
         </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-muted/20 relative overflow-hidden">
        {(!status || status.status === 'QUEUED' || status.status === 'PROCESSING') && (
           <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">
                {status?.status === 'QUEUED' ? 'Waiting in queue...' : 'Generating image...'}
              </p>
           </div>
        )}

        {status?.status === 'FAILED' && (
           <div className="text-destructive">
             Error: {status.error || 'Generation failed'}
           </div>
        )}

        {status?.status === 'COMPLETED' && status.images && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-4 overflow-auto">
              {status.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square w-full bg-black rounded-lg overflow-hidden group">
                   {/* Note: We need a real URL here. For Mock, the worker returns a full URL in 'storagePath' */}
                   {/* In real production, we'd wrap this with getPublicUrl */}
                   <Image 
                     src={img.storagePath} 
                     alt={`Generated seed ${img.seed}`}
                     fill
                     className="object-cover"
                   />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {/* Actions like Download / Upscale would go here */}
                   </div>
                </div>
              ))}
           </div>
        )}
    </Card>
  );
}
