'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SafeImage from '@/components/ui/SafeImage';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/cloudinary';
import { Check, Copy, ExternalLink, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className = '',
  label = 'Image',
  placeholder = 'Enter image URL or upload an image',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const copyTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) window.clearTimeout(copyTimeout.current);
    };
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const imageUrl = await uploadFile(file, setUploadProgress);
        onChange(imageUrl as string);

        toast({
          title: 'Success',
          description: 'Image uploaded successfully!',
        });
      } catch (error: any) {
        console.error('Upload failed:', error);
        toast({
          title: 'Upload failed',
          description: error.message || 'Failed to upload image.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [toast, onChange],
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);

      if (disabled || isUploading) return;

      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [disabled, isUploading, handleFileUpload],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="image-upload">{label}</Label>

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          id="image-url"
          type="url"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isUploading}
          className="flex-1"
        />
        {value && onRemove && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRemove}
            disabled={disabled || isUploading}
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <div className="text-sm text-gray-600">Uploading... {uploadProgress}%</div>
              <div className="h-2 w-32 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Drag and drop an image here, or click to browse
                </p>
                <p className="text-xs text-gray-500">Supports: JPG, PNG, GIF, WebP (max 10MB)</p>
              </div>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
                className="sr-only"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={disabled || isUploading}
              >
                <ImageIcon size={16} className="mr-2" />
                Choose Image
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {value && !isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="relative">
                <SafeImage
                  src={value}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="h-48 w-full max-w-md rounded-lg border object-cover"
                />
              </div>
              <div className="flex items-start gap-2">
                <p className="flex-1 break-all text-xs text-gray-500">{value}</p>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(value);
                        toast({ title: 'Copied!', description: 'Image URL copied to clipboard.' });
                        setCopiedUrl(value);
                        if (copyTimeout.current) window.clearTimeout(copyTimeout.current);
                        copyTimeout.current = window.setTimeout(() => setCopiedUrl(null), 1000);
                      } catch {
                        toast({
                          title: 'Failed to copy',
                          description: 'Please copy the URL manually.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    title="Copy URL"
                  >
                    {copiedUrl === value ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(value, '_blank')}
                    title="Open in new tab"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
