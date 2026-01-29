'use client';

import { useState } from "react";
import { GenerationForm } from "@/components/generation/GenerationForm";
import { ImageViewer } from "@/components/generation/ImageViewer";
import { HistoryGallery } from "@/components/generation/HistoryGallery";
import { QueuedJobs } from "@/components/generation/QueuedJobs";
import { GenerationJobResponse } from "@/application/dtos/generation.schema";

export default function GeneratePage() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleGenerationStarted = (job: GenerationJobResponse) => {
    setCurrentJobId(job.id);
  };

  const handleGenerationCompleted = () => {
    setHistoryKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto max-w-[1800px] h-screen pt-20 pb-4">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Panel: Controls */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <GenerationForm onSuccess={handleGenerationStarted} />
          <QueuedJobs />
        </div>

        {/* Right Panel: Viewer */}
        <div className="col-span-12 lg:col-span-9 h-full flex flex-col gap-4">
           <div className="flex-1 min-h-0">
             <ImageViewer jobId={currentJobId} onCompleted={handleGenerationCompleted} />
           </div>
           
           {/* History Gallery */}
           <div className="h-[300px] min-h-0">
              <HistoryGallery key={historyKey} />
           </div>
        </div>
      </div>
    </div>
  );
}
