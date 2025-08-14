'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import DOMPurify from 'dompurify';
import * as z from 'zod';
import { toast } from 'sonner';
import { Globe, Share2, Twitter, Facebook, Linkedin, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

// Form schema definition
const metaDataFormSchema = z.object({
  // Basic
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(60, { message: 'Title should be less than 60 characters' }),
  description: z
    .string()
    .min(50, { message: 'Description must be at least 50 characters' })
    .max(160, { message: 'Description should be less than 160 characters' }),
  keywords: z.string().optional(),
  canonicalUrl: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal('')),
  language: z.string().default('en'),

  // OpenGraph
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z
    .string()
    .url({ message: 'Please enter a valid image URL' })
    .optional()
    .or(z.literal('')),
  ogUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  ogType: z.enum(['website', 'article', 'profile', 'book', 'music', 'video']).default('website'),

  // Twitter
  twitterCard: z
    .enum(['summary', 'summary_large_image', 'app', 'player'])
    .default('summary_large_image'),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z
    .string()
    .url({ message: 'Please enter a valid image URL' })
    .optional()
    .or(z.literal('')),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),

  // Advanced
  robots: z.object({
    index: z.boolean().default(true),
    follow: z.boolean().default(true),
    noarchive: z.boolean().default(false),
    nosnippet: z.boolean().default(false),
    notranslate: z.boolean().default(false),
    maxSnippet: z.number().min(-1).max(600).default(-1),
    maxImagePreview: z.enum(['none', 'standard', 'large']).default('large'),
    maxVideoPreview: z.number().min(-1).max(600).default(-1),
  }),
  viewport: z.string().default('width=device-width, initial-scale=1'),
  themeColor: z.string().optional(),
  favicon: z.string().optional(),
});

type MetaDataFormValues = z.infer<typeof metaDataFormSchema>;

const MetaDataGeneratorModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('form');

  const form = useForm<MetaDataFormValues>({
    resolver: zodResolver(metaDataFormSchema),
    defaultValues: {
      title: '',
      description: '',
      keywords: '',
      canonicalUrl: '',
      language: 'en',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      robots: {
        index: true,
        follow: true,
        noarchive: false,
        nosnippet: false,
        notranslate: false,
        maxSnippet: -1,
        maxImagePreview: 'large',
        maxVideoPreview: -1,
      },
      viewport: 'width=device-width, initial-scale=1',
    },
  });

  // Load saved form data from localStorage if available
  useEffect(() => {
    try {
      const savedFormData = localStorage.getItem('metaDataFormValues');
      if (savedFormData) {
        const parsedData = JSON.parse(savedFormData);
        form.reset(parsedData);
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  }, [form]);

  const clearForm = () => {
    form.reset({
      title: '',
      description: '',
      keywords: '',
      canonicalUrl: '',
      language: 'en',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      ogUrl: '',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      twitterSite: '',
      twitterCreator: '',
      robots: {
        index: true,
        follow: true,
        noarchive: false,
        nosnippet: false,
        notranslate: false,
        maxSnippet: -1,
        maxImagePreview: 'large',
        maxVideoPreview: -1,
      },
      viewport: 'width=device-width, initial-scale=1',
      themeColor: '',
      favicon: '',
    });
    localStorage.removeItem('metaDataFormValues');
    toast.success('Form cleared');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast.success('Meta tags copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const onSubmit = (data: MetaDataFormValues) => {
    // Save form data to localStorage
    try {
      localStorage.setItem('metaDataFormValues', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving form data:', error);
    }

    // Generate HTML Meta Tags
    let metaHTML = '<!-- Primary Meta Tags -->\n';
    metaHTML += `<title>${data.title}</title>\n`;
    metaHTML += `<meta name="title" content="${data.title}" />\n`;
    metaHTML += `<meta name="description" content="${data.description}" />\n`;

    if (data.keywords) {
      metaHTML += `<meta name="keywords" content="${data.keywords}" />\n`;
    }

    if (data.canonicalUrl) {
      metaHTML += `<link rel="canonical" href="${data.canonicalUrl}" />\n`;
    }

    if (data.language) {
      metaHTML += `<meta http-equiv="content-language" content="${data.language}" />\n`;
    }

    // Viewport
    metaHTML += `<meta name="viewport" content="${data.viewport}" />\n`;

    // Theme color
    if (data.themeColor) {
      metaHTML += `<meta name="theme-color" content="${data.themeColor}" />\n`;
    }

    // Favicon
    if (data.favicon) {
      metaHTML += `<link rel="icon" href="${data.favicon}" />\n`;
    }

    // Open Graph / Facebook
    metaHTML += '\n<!-- Open Graph / Facebook -->\n';
    metaHTML += `<meta property="og:type" content="${data.ogType}" />\n`;
    metaHTML += `<meta property="og:title" content="${data.ogTitle || data.title}" />\n`;
    metaHTML += `<meta property="og:description" content="${data.ogDescription || data.description}" />\n`;

    if (data.ogUrl || data.canonicalUrl) {
      metaHTML += `<meta property="og:url" content="${data.ogUrl || data.canonicalUrl}" />\n`;
    }

    if (data.ogImage) {
      metaHTML += `<meta property="og:image" content="${data.ogImage}" />\n`;
    }

    // Twitter
    metaHTML += '\n<!-- Twitter -->\n';
    metaHTML += `<meta property="twitter:card" content="${data.twitterCard}" />\n`;

    if (data.twitterSite) {
      metaHTML += `<meta property="twitter:site" content="${data.twitterSite}" />\n`;
    }

    if (data.twitterCreator) {
      metaHTML += `<meta property="twitter:creator" content="${data.twitterCreator}" />\n`;
    }

    metaHTML += `<meta property="twitter:title" content="${data.twitterTitle || data.ogTitle || data.title}" />\n`;
    metaHTML += `<meta property="twitter:description" content="${data.twitterDescription || data.ogDescription || data.description}" />\n`;

    if (data.twitterImage || data.ogImage) {
      metaHTML += `<meta property="twitter:image" content="${data.twitterImage || data.ogImage}" />\n`;
    }

    // Robots
    let robotsContent = [];
    if (!data.robots.index) robotsContent.push('noindex');
    else robotsContent.push('index');

    if (!data.robots.follow) robotsContent.push('nofollow');
    else robotsContent.push('follow');

    if (data.robots.noarchive) robotsContent.push('noarchive');
    if (data.robots.nosnippet) robotsContent.push('nosnippet');
    if (data.robots.notranslate) robotsContent.push('notranslate');

    metaHTML += '\n<!-- Robots -->\n';
    metaHTML += `<meta name="robots" content="${robotsContent.join(', ')}" />\n`;

    if (data.robots.maxSnippet !== -1) {
      metaHTML += `<meta name="googlebot" content="max-snippet:${data.robots.maxSnippet}" />\n`;
    }

    if (data.robots.maxImagePreview !== 'large') {
      metaHTML += `<meta name="googlebot" content="max-image-preview:${data.robots.maxImagePreview}" />\n`;
    }

    if (data.robots.maxVideoPreview !== -1) {
      metaHTML += `<meta name="googlebot" content="max-video-preview:${data.robots.maxVideoPreview}" />\n`;
    }

    setGeneratedCode(metaHTML);
    setActiveTab('result');
    toast.success('Meta tags generated successfully!');
  };

  const previewURL = () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    const image = form.getValues('ogImage') || '';
    const isValidUrl = (url: string) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      } catch {
        return false;
      }
    };

    const sanitizedImage = isValidUrl(image) ? DOMPurify.sanitize(image) : '';

    return (
      <div className="mb-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          {sanitizedImage && (
            <Image
              src={sanitizedImage}
              alt="Preview image"
              className="mb-2 h-48 w-full rounded-lg object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          )}
          <h3 className="line-clamp-1 font-bold text-blue-600 dark:text-blue-400">
            {title || 'Your Page Title'}
          </h3>
          <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {description ||
              "Your page description will appear here. Make sure it's compelling and informative."}
          </p>
          <p className="truncate text-xs text-gray-400">
            {form.getValues('ogUrl') || form.getValues('canonicalUrl') || 'https://yourdomain.com'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-5 w-5" /> Meta Data Generator
          </DialogTitle>
          <DialogDescription>
            Generate perfect SEO meta tags for your website in seconds
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-3">
            <TabsTrigger value="form">Meta Data Form</TabsTrigger>
            <TabsTrigger value="preview">Social Preview</TabsTrigger>
            <TabsTrigger value="result">Generated Code</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <h3 className="border-b pb-2 text-lg font-medium">Basic Meta Tags</h3>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Page Title <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Your Page Title" {...field} />
                          </FormControl>
                          <FormDescription>Optimal length: 50-60 characters</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Meta Description <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of your page content"
                              className="h-24 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Optimal length: 150-160 characters</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keywords</FormLabel>
                          <FormControl>
                            <Input placeholder="keyword1, keyword2, keyword3" {...field} />
                          </FormControl>
                          <FormDescription>
                            Comma-separated keywords (less important for modern SEO)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canonicalUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canonical URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourdomain.com/page" {...field} />
                          </FormControl>
                          <FormDescription>
                            The preferred URL for this page to avoid duplicate content issues
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="ja">Japanese</SelectItem>
                              <SelectItem value="zh">Chinese</SelectItem>
                              <SelectItem value="hi">Hindi</SelectItem>
                              <SelectItem value="ar">Arabic</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="border-b pb-2 text-lg font-medium">
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Open Graph / Social Media
                      </div>
                    </h3>

                    <FormField
                      control={form.control}
                      name="ogTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Title for social media (defaults to main title)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description for social media (defaults to main description)"
                              className="h-20 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourdomain.com/image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>Optimal size: 1200 × 630 pixels</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourdomain.com/page" {...field} />
                          </FormControl>
                          <FormDescription>If different from canonical URL</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select content type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="profile">Profile</SelectItem>
                              <SelectItem value="book">Book</SelectItem>
                              <SelectItem value="music">Music</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="border-b pb-2 text-lg font-medium">
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter Card
                      </div>
                    </h3>

                    <FormField
                      control={form.control}
                      name="twitterCard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Card Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select card type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="summary">Summary</SelectItem>
                              <SelectItem value="summary_large_image">
                                Summary Large Image
                              </SelectItem>
                              <SelectItem value="app">App</SelectItem>
                              <SelectItem value="player">Player</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Title for Twitter (defaults to OG title)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Description for Twitter (defaults to OG description)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Image URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://yourdomain.com/twitter-image.jpg"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>If different from OG image</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterSite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Site</FormLabel>
                          <FormControl>
                            <Input placeholder="@yoursitehandle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterCreator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Creator</FormLabel>
                          <FormControl>
                            <Input placeholder="@yourpersonalhandle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="border-b pb-2 text-lg font-medium">Advanced Settings</h3>

                    <div className="space-y-4">
                      <h4 className="font-medium">Robots Settings</h4>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="robots.index"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Allow indexing</FormLabel>
                                <FormDescription>
                                  Let search engines index this page
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="robots.follow"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Follow links</FormLabel>
                                <FormDescription>
                                  Allow search engines to follow links on this page
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="robots.noarchive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>No Archive</FormLabel>
                                <FormDescription>Don&apos;t show cached version</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="robots.nosnippet"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>No Snippet</FormLabel>
                                <FormDescription>Don&apos;t show a text snippet</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="robots.notranslate"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>No Translate</FormLabel>
                                <FormDescription>Don&apos;t offer translation</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="viewport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Viewport</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Controls how the page appears on mobile devices
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="themeColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme Color</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input type="text" placeholder="#ffffff" {...field} />
                            </FormControl>
                            <Input
                              type="color"
                              className="ml-2 w-12 p-1"
                              value={field.value || '#ffffff'}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                          <FormDescription>
                            Color for browser UI elements like the address bar
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="favicon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favicon URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourdomain.com/favicon.ico" {...field} />
                          </FormControl>
                          <FormDescription>URL to your site&apos;s favicon</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={clearForm} className="mr-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Form
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Generate Meta Tags</Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-medium">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  Facebook Preview
                </h3>
                {previewURL()}
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-medium">
                  <Twitter className="h-5 w-5 text-sky-500" />
                  Twitter Preview
                </h3>
                {previewURL()}
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-medium">
                  <Linkedin className="h-5 w-5 text-blue-700" />
                  LinkedIn Preview
                </h3>
                {previewURL()}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('form')}>Back to Form</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Button size="sm" className="absolute right-2 top-2" onClick={copyToClipboard}>
                  Copy
                </Button>
                <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm dark:bg-slate-800">
                  {generatedCode}
                </pre>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <h3 className="mb-2 flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                  </svg>
                  Implementation Guide
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300/80">
                  Copy the generated meta tags and paste them into the{' '}
                  <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">
                    &lt;head&gt;
                  </code>{' '}
                  section of your HTML document. These tags help search engines and social media
                  platforms understand and display your content correctly.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab('form')}>
                  Edit
                </Button>
                <Button onClick={copyToClipboard}>Copy to Clipboard</Button>
                <Button
                  onClick={() => {
                    const blob = new Blob([generatedCode], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'meta-tags.txt';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Main component for metadata generator card
const MetaDataGenerator = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-green-300 bg-gradient-to-br from-green-50 via-white to-green-100 p-8 shadow-xl dark:border-green-700 dark:from-green-900/60 dark:via-green-950/80 dark:to-green-900/60">
      <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-green-200 opacity-30 blur-2xl dark:bg-green-800" />
      <div className="absolute -bottom-10 -left-10 z-0 h-32 w-32 rounded-full bg-green-100 opacity-20 blur-2xl dark:bg-green-900" />

      <h2 className="z-10 mb-3 text-2xl font-extrabold tracking-tight text-green-800 drop-shadow-lg dark:text-green-100">
        <span className="mr-2 inline-block align-middle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="inline-block text-green-500 dark:text-green-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        </span>
        Meta Tags Generator
      </h2>

      <p className="z-10 mb-6 max-w-lg text-center text-sm text-green-700/80 dark:text-green-200/80 md:text-base">
        Create perfect SEO meta tags for your website. Optimize for search engines and social media
        with custom titles, descriptions, and images.
      </p>

      <Button
        onClick={() => setShowModal(true)}
        className="z-10 flex items-center gap-2 rounded-xl border-0 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 px-8 py-3 text-lg font-bold shadow-lg transition-all duration-200 hover:from-green-600 hover:to-emerald-600"
        style={{ minWidth: 240 }}
      >
        <Share2 className="h-5 w-5" />
        Generate Meta Tags
      </Button>

      {showModal && <MetaDataGeneratorModal open={showModal} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default MetaDataGenerator;
