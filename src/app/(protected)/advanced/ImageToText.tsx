'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, Download, Eye, ImageIcon, RotateCcw, Upload } from 'lucide-react';
import Image from 'next/image';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import MDEditor from '@uiw/react-md-editor';
import { useTheme } from 'next-themes';

interface AnalysisResponse {
  analysis: string;
  error?: string;
}

const ImageToText: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>('Describe what you see in this image');
  const { theme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
    ];
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const fileType = selectedFile.type;
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = validExts.some((ext) => fileName.endsWith(ext));

    const forbiddenExts = [
      '.exe',
      '.bat',
      '.sh',
      '.js',
      '.ts',
      '.py',
      '.php',
      '.pl',
      '.rb',
      '.jar',
      '.com',
      '.msi',
      '.cmd',
      '.scr',
      '.pif',
      '.cpl',
      '.msc',
      '.gadget',
    ];
    const hasDoubleExt = fileName.split('.').length > 2;
    const hasForbiddenExt = forbiddenExts.some((ext) => fileName.endsWith(ext));

    if (hasDoubleExt || hasForbiddenExt) {
      toast.error('File name is not allowed for security reasons.');
      return;
    }

    if (!(validTypes.includes(fileType) || hasValidExt)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WebP, BMP)');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setAnalysis('');

    const url = URL.createObjectURL(selectedFile);
    setImageUrl(url);
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please select an image file first');
      return;
    }

    if (!question.trim()) {
      toast.error('Please enter a question or description request');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('question', question.trim());

      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Analysis failed');
      }

      const data: AnalysisResponse = await response.json();
      setAnalysis(data.analysis);
      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis('');
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!analysis) return;

    const blob = new Blob([analysis], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image_analysis_${file?.name || 'image'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quickQuestions = [
    'Describe what you see in this image',
    'What text is visible in this image?',
    'What are the main colors and objects?',
    'What is the mood or atmosphere of this image?',
    'Are there any people in this image? Describe them.',
    'What is the setting or location?',
  ];

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Image to Text Analyzer
          <Badge variant="outline" className="ml-2">
            Gemini Vision
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Analyze images and extract text using Google&apos;s Gemini Vision AI. Ask questions about
          the content, objects, text, or context.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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
              {file ? 'Change Image' : 'Select Image'}
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
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {dragActive && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/80 text-blue-700 transition-all animate-in fade-in dark:bg-blue-900/60 dark:text-blue-200"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mb-2 h-8 w-8" />
              <span className="font-semibold">Drop your image here</span>
              <span className="mt-1 text-xs">JPG, PNG, GIF, WebP, BMP (max 10MB)</span>
            </div>
          )}

          <div
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/40 py-8 transition-all hover:border-blue-400 dark:bg-blue-900/30 ${dragActive ? 'pointer-events-none opacity-50' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label="Upload image file by clicking or dragging"
          >
            <ImageIcon className="mb-2 h-8 w-8 text-blue-500" />
            <span className="font-medium">Drag & drop or click to select an image</span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, GIF, WebP, BMP (max 10MB)
            </span>
            {file && (
              <span className="mt-2 text-xs text-blue-700 dark:text-blue-200">
                Selected: {file.name}
              </span>
            )}
          </div>

          {file && imageUrl && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="relative mx-auto max-w-md">
                <Image
                  src={imageUrl}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="mx-auto max-h-64 w-auto rounded-lg border object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              What would you like to know about this image?
            </label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the image..."
              className="w-full"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(q)}
                  className="text-xs"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!file || !question.trim() || loading}
            size="lg"
            className="w-full max-w-md"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analyzing...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Analyze Image
              </>
            )}
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Analysis Result</h3>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(analysis);
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

            <div className="min-h-[200px] rounded-md border bg-background p-4" data-color-mode={theme === 'dark' ? 'dark' : 'light'}>
              {analysis ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MDEditor.Markdown source={analysis} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Analysis will appear here...</div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Characters: {analysis.length}</span>
              <span>Words: {analysis.split(/\s+/).filter(Boolean).length}</span>
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <h4 className="font-medium">Features:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Powered by Google&apos;s Gemini Vision AI</li>
            <li>Supports multiple image formats (JPG, PNG, GIF, WebP, BMP)</li>
            <li>Maximum file size: 10MB</li>
            <li>Extract text from images (OCR)</li>
            <li>Describe objects, people, and scenes</li>
            <li>Answer specific questions about image content</li>
            <li>Editable analysis results</li>
            <li>Download analysis as text file</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageToText;
