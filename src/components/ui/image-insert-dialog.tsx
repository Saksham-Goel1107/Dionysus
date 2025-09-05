'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SafeImage from '@/components/ui/SafeImage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/cloudinary';
import { Image as ImageIcon, Link, Loader2, Upload, X } from 'lucide-react';
import { useState } from 'react';

interface ImageInsertDialogProps {
  onInsert: (markdown: string) => void;
  trigger?: React.ReactNode;
}

export function ImageInsertDialog({ onInsert, trigger }: ImageInsertDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
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

      const uploadedUrl = await uploadFile(file, setUploadProgress);
      setImageUrl(uploadedUrl as string);

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
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleInsert = () => {
    if (!imageUrl.trim()) {
      toast({
        title: 'Missing image URL',
        description: 'Please provide an image URL or upload an image.',
        variant: 'destructive',
      });
      return;
    }

    const markdown = `![${altText || 'Image'}](${imageUrl})`;
    onInsert(markdown);

    // Reset form
    setImageUrl('');
    setAltText('');
    setOpen(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ImageIcon size={16} className="mr-2" />
            Insert Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Upload an image or provide a URL to insert into your content.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="url">Image URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card
              className="cursor-pointer border-2 border-dashed border-gray-300 transition-colors hover:border-gray-400"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                {isUploading ? (
                  <div className="space-y-2">
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
                      <p className="text-xs text-gray-500">
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
                      size="sm"
                      className="mt-3"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploading}
                    >
                      <Upload size={16} className="mr-2" />
                      Choose Image
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {imageUrl && (
              <div className="space-y-2">
                <Label>Uploaded Image</Label>
                <div className="relative">
                  <SafeImage
                    src={imageUrl}
                    alt="Uploaded preview"
                    className="max-h-48 w-full rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => setImageUrl('')}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="image-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {imageUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <SafeImage
                  src={imageUrl}
                  alt="URL preview"
                  width={200}
                  height={200}
                  className="max-h-48 w-full rounded-lg border object-cover"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="alt-text">Alt Text (Optional)</Label>
          <Input
            id="alt-text"
            placeholder="Describe the image for accessibility"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!imageUrl.trim() || isUploading}>
            Insert Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
