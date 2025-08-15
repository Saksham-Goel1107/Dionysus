'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, FileAudio, Pause, Play, RotateCcw, Upload, Volume2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

interface TranscriptionResponse {
  text: string;
  model: string;
  language?: string;
  duration?: number;
}

const AudioToText: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect({
        target: { files: e.dataTransfer.files },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } },
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/m4a',
      'audio/aac',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
    ];
    const validExts = ['.mp3', '.mpeg', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac'];
    const fileType = selectedFile.type;
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = validExts.some((ext) => fileName.endsWith(ext));

    if (!(validTypes.includes(fileType) || hasValidExt)) {
      toast.error('Please select a valid audio file (MP3, WAV, M4A, AAC, OGG, WebM, FLAC)');
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 25MB');
      return;
    }

    setFile(selectedFile);
    setTranscription('');

    const url = URL.createObjectURL(selectedFile);
    setAudioUrl(url);
  };

  const handleTranscribe = async () => {
    if (!file) {
      toast.error('Please select an audio file first');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'json');

      const response = await fetch('/api/audio-transcription', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Transcription failed');
      }

      const data: TranscriptionResponse = await response.json();
      setTranscription(data.text);
      setDuration(data.duration || null);
      toast.success('Audio transcribed successfully!');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioControl = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setFile(null);
    setTranscription('');
    setAudioUrl(null);
    setIsPlaying(false);
    setDuration(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!transcription) return;

    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_${file?.name || 'audio'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Audio to Text Converter
          <Badge variant="outline" className="ml-2">
            Grok Whisper v3 Turbo
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Convert audio files to text using Grok&apos;s advanced Whisper model. Supports MP3, WAV,
          M4A, AAC, OGG, WebM, and FLAC formats.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className={`relative space-y-4 ${dragActive ? 'z-10' : ''}`} onDragEnter={handleDrag}>
          <div
            className={`flex items-center gap-4 ${dragActive ? 'pointer-events-none opacity-50' : ''}`}
          >
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant={file ? 'outline' : 'default'}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {file ? 'Change File' : 'Select Audio File'}
            </Button>
            {file && (
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {dragActive && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/80 text-emerald-700 transition-all animate-in fade-in dark:bg-emerald-900/60 dark:text-emerald-200"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mb-2 h-8 w-8" />
              <span className="font-semibold">Drop your audio file here</span>
              <span className="mt-1 text-xs">MP3, WAV, M4A, AAC, OGG, WebM, FLAC (max 25MB)</span>
            </div>
          )}

          <div
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/40 py-8 transition-all hover:border-emerald-400 dark:bg-emerald-900/30 ${dragActive ? 'pointer-events-none opacity-50' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label="Upload audio file by clicking or dragging"
          >
            <Upload className="mb-2 h-8 w-8 text-emerald-500" />
            <span className="font-medium">Drag & drop or click to select an audio file</span>
            <span className="mt-1 text-xs text-muted-foreground">
              MP3, WAV, M4A, AAC, OGG, WebM, FLAC (max 25MB)
            </span>
            {file && (
              <span className="mt-2 text-xs text-emerald-700 dark:text-emerald-200">
                Selected: {file.name}
              </span>
            )}
          </div>

          {file && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileAudio className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* Audio Player */}
              {audioUrl && (
                <div className="flex items-center gap-3">
                  <Button onClick={handleAudioControl} variant="outline" size="sm">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1 text-sm text-muted-foreground">
                    {duration && `Duration: ${formatTime(duration)}`}
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onLoadedMetadata={() => {
                      if (audioRef.current) {
                        setDuration(audioRef.current.duration);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleTranscribe}
            disabled={!file || loading}
            size="lg"
            className="w-full max-w-md"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Transcribing...
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-4 w-4" />
                Transcribe Audio
              </>
            )}
          </Button>
        </div>

        {transcription && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Transcription Result</h3>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(transcription);
                    toast.success('Copied to clipboard!');
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
            <Textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Transcription will appear here..."
              className="min-h-[200px] resize-none"
              readOnly={false}
            />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Characters: {transcription.length}</span>
              <span>Words: {transcription.split(/\s+/).filter(Boolean).length}</span>
              {duration && <span>Audio Duration: {formatTime(duration)}</span>}
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <h4 className="font-medium">Features:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Powered by Grok&apos;s Whisper-large-v3-turbo model</li>
            <li>Supports multiple audio formats (MP3, WAV, M4A, AAC, OGG, WebM, FLAC)</li>
            <li>Maximum file size: 25MB</li>
            <li>High accuracy speech recognition</li>
            <li>Editable transcription results</li>
            <li>Download transcription as text file</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioToText;
