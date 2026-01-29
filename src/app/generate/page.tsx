'use client';

import { useState } from "react";
import { GenerationForm } from "@/components/generation/GenerationForm";
import { ImageViewer } from "@/components/generation/ImageViewer";
import { GenerationJobResponse } from "@/application/dtos/generation.schema";

export default function GeneratePage() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const handleGenerationStarted = (job: GenerationJobResponse) => {
    setCurrentJobId(job.id);
  };

  return (
    <div className="container mx-auto max-w-[1600px] h-screen pt-20 pb-4">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Panel: Controls */}
        <div className="col-span-12 lg:col-span-3 h-full overflow-y-auto pr-2">
           <GenerationForm onSuccess={handleGenerationStarted} />
        </div>

        {/* Right Panel: Viewer */}
        <div className="col-span-12 lg:col-span-9 h-full flex flex-col gap-4">
           <div className="flex-1 min-h-0">
             <ImageViewer jobId={currentJobId} />
           </div>
           
           {/* Bottom Strip (Placeholder for History) */}
           <div className="h-32 bg-muted/10 rounded-lg border border-border p-4 flex items-center gap-2 overflow-x-auto">
              <span className="text-muted-foreground text-xs pl-2">Recent functionality coming soon...</span>
           </div>
        </div>
      </div>
    </div>
  );
}
