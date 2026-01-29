'use client';

import { useState, useEffect } from "react";
import { getUserJobsAction } from "@/app/actions/generation";
import { GenerationJob } from "@/domain/entities/GenerationJob";
import { Card } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle, XCircle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function QueuedJobs() {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  async function fetchJobs() {
    const res = await getUserJobsAction();
    if (res.success) {
      setJobs(res.data);
    }
    setLoading(false);
  }

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

  if (loading) {
    return (
      <Card className="p-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading jobs...</span>
        </div>
      </Card>
    );
  }

  const recentJobs = jobs.slice(0, 10); // Show last 10

  return (
    <Card className="p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Recent Generations</h3>
        <Link href="/history">
          <Button variant="outline" size="sm">
            View All History
          </Button>
        </Link>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {recentJobs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No generations yet.</p>
        ) : (
          recentJobs.map((job) => (
            <div key={job.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
              {getStatusIcon(job.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {job.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">{job.prompt}</p>
                {job.errorMessage && (
                  <p className="text-xs text-destructive mt-1">{job.errorMessage}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}