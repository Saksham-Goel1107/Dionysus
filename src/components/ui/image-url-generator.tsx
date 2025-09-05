'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import SafeImage from '@/components/ui/SafeImage';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/cloudinary';
import { Copy, ExternalLink, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';

interface UploadedImage {
  url: string;
  filename: string;
  size: string;
}

export function ImageUrlGenerator() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
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

      if (typeof imageUrl !== 'string') {
        throw new Error('Upload did not return a valid image URL.');
      }

      const newImage: UploadedImage = {
        url: imageUrl,
        filename: String(file.name),
        size: formatFileSize(file.size),
      };

      setUploadedImages((prev) => [newImage, ...prev]);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully! URL copied to clipboard.',
      });

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description:
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: unknown }).message)
            : 'Failed to upload image.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Copied!',
        description: 'Image URL copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL manually.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image URL Generator</CardTitle>
          <CardDescription>
            Upload images and get Cloudinary URLs that you can use in your blog posts or markdown
            editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Card
            className={`border-2 border-dashed transition-colors ${
              isUploading
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'cursor-pointer border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              {isUploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Uploading...</p>
                    <p className="text-xs text-gray-600">{uploadProgress}%</p>
                  </div>
                  <div className="h-2 w-48 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mb-4 h-10 w-10 text-gray-400" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Drag and drop an image here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports: JPG, PNG, GIF, WebP (max 10MB)
                    </p>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="sr-only"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading}
                  >
                    <Upload size={16} className="mr-2" />
                    Choose Images
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Images</CardTitle>
            <CardDescription>Click on any URL to copy it to your clipboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedImages.map((image, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <SafeImage
                    src={image.url}
                    alt={image.filename}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{image.filename}</p>
                    <p className="text-xs text-gray-500">{image.size}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(image.url)}
                      title="Copy URL"
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(image.url, '_blank')}
                      title="Open in new tab"
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
