'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageInsertDialog } from '@/components/ui/image-insert-dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Image as ImageIcon, Save } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface BlogEditorProps {
  blogId?: string;
  isEdit?: boolean;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  isPublished: boolean;
  isSponsored: boolean;
  publishedAt?: string | null;
  tags: string[];
}

export default function BlogEditor({ blogId, isEdit = false }: BlogEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState<BlogFormData | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    isPublished: false,
    isSponsored: false,
    publishedAt: isEdit ? null : new Date().toISOString(),
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const fetchBlog = useCallback(async () => {
    if (!blogId || !isEdit) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/blogs/${blogId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch blog');
      }

      const data = await response.json();
      const blog = data.blog;

      setFormData({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt || '',
        content: blog.content,
        coverImage: blog.coverImage || '',
        isPublished: blog.isPublished,
        isSponsored: blog.isSponsored || false,
        publishedAt: blog.publishedAt || null,
        tags: blog.tags.map((tag: any) => tag.name),
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch blog.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [blogId, isEdit, toast]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  // Track unsaved changes
  useEffect(() => {
    if (initialFormData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialFormData]);

  // Set initial form data after loading
  useEffect(() => {
    if (!isLoading && !initialFormData && formData.title) {
      setInitialFormData({ ...formData });
    }
  }, [isLoading, formData, initialFormData]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Handle navigation with unsaved changes
  const handleNavigationAttempt = (navigationAction: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationAction);
      setShowUnsavedChangesModal(true);
    } else {
      navigationAction();
    }
  };

  // Handle modal actions
  const handleSaveAndContinue = async () => {
    setShowUnsavedChangesModal(false);
    await handleSave(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleDiscardAndContinue = () => {
    setShowUnsavedChangesModal(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedChangesModal(false);
    setPendingNavigation(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleImageInsert = (markdown: string) => {
    const newContent = formData.content + '\n\n' + markdown + '\n';
    setFormData((prev) => ({
      ...prev,
      content: newContent,
    }));
  };

  const handleSave = async (shouldExit = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Title and content are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const url = isEdit ? `/api/admin/blogs/${blogId}` : '/api/admin/blogs';
      const method = isEdit ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        ...(formData.publishedAt ? { publishedAt: formData.publishedAt } : {}),
        ...(isEdit && { action: 'update' }),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save blog');
      }

      const actionText = formData.isPublished
        ? isEdit
          ? 'Blog updated and published!'
          : 'Blog created and published!'
        : isEdit
          ? 'Blog updated successfully!'
          : 'Blog draft saved successfully!';

      toast({
        title: 'Success',
        description: actionText,
      });

      // Update initial form data to reflect saved state
      setInitialFormData({ ...formData });
      setHasUnsavedChanges(false);

      if (shouldExit) {
        router.push('/admin/blogs');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save blog.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-gray-500">Loading blog...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl overflow-hidden p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigationAttempt(() => router.push('/admin/blogs'))}
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? 'Edit Blog Post' : 'Create Blog Post'}
              {hasUnsavedChanges && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  • Unsaved changes
                </span>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {isEdit ? 'Update your blog post' : 'Create a new blog post for your platform'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save and Exit'}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="min-h-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter blog post title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="url-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500">
                  This will be the URL: /blogs/{formData.slug}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of the blog post"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Content *</Label>
                  <ImageInsertDialog
                    onInsert={handleImageInsert}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        <ImageIcon size={16} className="mr-2" />
                        Insert Image
                      </Button>
                    }
                  />
                </div>
                <div data-color-mode="light" className="max-h-[65vh] min-h-[500px] overflow-auto">
                  <MDEditor
                    value={formData.content}
                    onChange={(value) => setFormData((prev) => ({ ...prev, content: value || '' }))}
                    preview="edit"
                    height={500}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="min-h-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPublished: checked }))
                  }
                />
                <Label htmlFor="published">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sponsored"
                  checked={formData.isSponsored}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isSponsored: checked }))
                  }
                />
                <Label htmlFor="sponsored">Sponsored</Label>
              </div>

              <div className="space-y-2">
                <Label>Publish Date</Label>
                <div className="w-full">
                  <Calendar
                    mode="single"
                    selected={formData.publishedAt ? new Date(formData.publishedAt) : undefined}
                    onSelect={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        publishedAt: date ? date.toISOString() : null,
                      }))
                    }
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Leave empty to publish immediately (or on publish action).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.coverImage}
                onChange={(url) => setFormData((prev) => ({ ...prev, coverImage: url }))}
                onRemove={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                label="Cover Image"
                placeholder="Enter cover image URL or upload an image"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      <Dialog open={showUnsavedChangesModal} onOpenChange={setShowUnsavedChangesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleCancelNavigation}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDiscardAndContinue}>
              Discard Changes
            </Button>
            <Button onClick={handleSaveAndContinue} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
