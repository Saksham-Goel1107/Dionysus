'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Download, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';

interface TranscriptViewerProps {
  meetingId: string;
}

export default function TranscriptViewer({ meetingId }: TranscriptViewerProps) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [meetingName, setMeetingName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  const fetchTranscript = useCallback(async () => {
    if (!open) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/meeting-transcript/${meetingId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transcript');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setMeetingName(data.name);
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transcript');
    } finally {
      setLoading(false);
    }
  }, [open, meetingId]);

  useEffect(() => {
    if (open) {
      fetchTranscript();
    }
  }, [open, meetingId, fetchTranscript]);

  const downloadTranscript = async () => {
    try {
      const response = await fetch(`/api/meeting-transcript/${meetingId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to download transcript');
      }

      // Get the transcript content
      const transcriptText = await response.text();

      // Create a blob and download it
      const blob = new Blob([transcriptText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meetingName.replace(/\s+/g, '_')}_transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading transcript:', err);
      setError('Failed to download transcript');
    }
  };
  // useEffect for open state is no longer needed as we use the enabled option in the query

  const formatTranscript = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Check if line contains speaker info (e.g., "Speaker 1:", "John:")
      const speakerMatch = line.match(/^(Speaker\s*\d+|[A-Za-z]+):\s*(.*)/i);

      if (speakerMatch) {
        const [, speaker, text] = speakerMatch;
        return (
          <div key={index} className="mb-4">
            <span className="font-semibold text-primary">{speaker}:</span>
            <span className="ml-2">{text}</span>
          </div>
        );
      }

      return (
        <div key={index} className="mb-2">
          {line}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <FileText className="h-4 w-4 mr-1" />
          View Transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Meeting Transcript: {meetingName}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadTranscript}
              disabled={loading || !transcript}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </DialogTitle>
          <DialogDescription>Complete transcript of the recorded meeting</DialogDescription>
        </DialogHeader>

        <div
          className={`mt-4 p-4 rounded-md ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
        >
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : transcript ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">{formatTranscript(transcript)}</div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No transcript available for this meeting
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
