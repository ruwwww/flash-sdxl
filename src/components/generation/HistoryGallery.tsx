'use client';

import { useState, useEffect } from "react";
import { getUserHistoryAction } from "@/app/actions/generation";
import { GeneratedImageDto } from "@/domain/repositories/IGenerationRepository";
import { Card } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import Image from "next/image";

export function HistoryGallery() {
  const [images, setImages] = useState<GeneratedImageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    const res = await getUserHistoryAction();
    if (res.success) {
      setImages(res.data);
      setError(null);
    } else {
      setError(res.error || "Failed to load history");
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <Card className="h-full min-h-[200px] flex items-center justify-center bg-muted/20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full min-h-[200px] flex flex-col items-center justify-center bg-muted/20 gap-2 p-6 text-center">
        {error.includes("Premium") ? <Lock className="w-8 h-8 text-yellow-600 mb-2" /> : null}
        <p className="text-sm font-medium text-destructive">{error}</p>
        <button onClick={fetchHistory} className="text-xs text-primary underline mt-2">Try Again</button>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="h-full min-h-[200px] flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground text-sm">No history found.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-muted/20">
      <h3 className="text-sm font-medium mb-4">Recent Generations</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2">
        {images.map((img, idx) => (
          <div key={`${img.generationId}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-black group border border-border/50">
            <Image 
              src={img.storagePath} 
              alt={`Seed ${img.seed}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
