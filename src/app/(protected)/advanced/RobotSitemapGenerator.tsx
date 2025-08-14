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
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { FileCode, Code, ServerIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Form schema definition
const sitemapRobotFormSchema = z.object({
  // Website details
  siteUrl: z.string().url({ message: 'Please enter a valid URL' }).min(1, 'Site URL is required'),

  // Robot.txt settings
  allowAll: z.boolean().default(false),
  disallowAll: z.boolean().default(false),
  customRules: z
    .array(
      z.object({
        userAgent: z.string(),
        rules: z.array(
          z.object({
            type: z.enum(['Allow', 'Disallow']),
            path: z.string(),
          }),
        ),
      }),
    )
    .default([]),
  crawlDelay: z.number().min(0).max(100).optional(),
  sitemap: z.boolean().default(true),
  host: z.boolean().default(false),

  // Sitemap settings
  includeSitemap: z.boolean().default(true),
  pages: z
    .array(
      z.object({
        url: z.string().url({ message: 'Please enter a valid URL' }),
        priority: z
          .string()
          .regex(/^(0(\.\d{1,2})?|1(\.0{1,2})?)$/, {
            message: 'Priority must be between 0.0 and 1.0',
          })
          .default('0.5'),
        changefreq: z
          .enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
          .default('monthly'),
        lastmod: z.string().optional(),
      }),
    )
    .default([]),
});

type SitemapRobotFormValues = z.infer<typeof sitemapRobotFormSchema>;

const defaultUserAgent = {
  userAgent: '*',
  rules: [{ type: 'Allow' as const, path: '/' }],
};

const RobotSitemapGeneratorModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [generatedRobotCode, setGeneratedRobotCode] = useState<string>('');
  const [generatedSitemapCode, setGeneratedSitemapCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('form');
  const [selectedTab, setSelectedTab] = useState<'robot' | 'sitemap'>('robot');

  const form = useForm<SitemapRobotFormValues>({
    resolver: zodResolver(sitemapRobotFormSchema),
    defaultValues: {
      siteUrl: '',
      allowAll: false,
      disallowAll: false,
      customRules: [defaultUserAgent],
      crawlDelay: 10,
      sitemap: true,
      host: false,
      includeSitemap: true,
      pages: [
        {
          url: '',
          priority: '0.5',
          changefreq: 'monthly',
          lastmod: new Date().toISOString().split('T')[0],
        },
      ],
    },
  });

  // Load saved form data from localStorage if available
  useEffect(() => {
    try {
      const savedFormData = localStorage.getItem('sitemapRobotFormValues');
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
      siteUrl: '',
      allowAll: false,
      disallowAll: false,
      customRules: [defaultUserAgent],
      crawlDelay: 10,
      sitemap: true,
      host: false,
      includeSitemap: true,
      pages: [
        {
          url: '',
          priority: '0.5',
          changefreq: 'monthly',
          lastmod: new Date().toISOString().split('T')[0],
        },
      ],
    });
    localStorage.removeItem('sitemapRobotFormValues');
    toast.success('Form cleared');
  };

  const addUserAgent = () => {
    const currentRules = form.getValues('customRules') ?? [];
    form.setValue('customRules', [
      ...currentRules,
      {
        userAgent: '',
        rules: [{ type: 'Allow' as const, path: '/' }],
      },
    ]);
  };

  const removeUserAgent = (index: number) => {
    const currentRules = form.getValues('customRules');
    if (currentRules.length > 1) {
      form.setValue(
        'customRules',
        currentRules.filter((_, i) => i !== index),
      );
    }
  };

  const addRule = (userAgentIndex: number) => {
    const currentRules = form.getValues('customRules');
    const updatedRules = [...currentRules];
    if (updatedRules[userAgentIndex] && Array.isArray(updatedRules[userAgentIndex].rules)) {
      updatedRules[userAgentIndex].rules.push({ type: 'Allow', path: '/' });
      form.setValue('customRules', updatedRules);
    }
  };

  const removeRule = (userAgentIndex: number, ruleIndex: number) => {
    const currentRules = form.getValues('customRules');
    const updatedRules = [...currentRules];
    if (
      updatedRules[userAgentIndex] &&
      updatedRules[userAgentIndex].rules &&
      updatedRules[userAgentIndex].rules.length > 1
    ) {
      updatedRules[userAgentIndex].rules = updatedRules[userAgentIndex].rules.filter(
        (_, i) => i !== ruleIndex,
      );
      form.setValue('customRules', updatedRules);
    }
  };

  const addPage = () => {
    const currentPages = form.getValues('pages');
    form.setValue('pages', [
      ...currentPages,
      {
        url: '',
        priority: '0.5',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const removePage = (index: number) => {
    const currentPages = form.getValues('pages');
    if (currentPages.length > 1) {
      form.setValue(
        'pages',
        currentPages.filter((_, i) => i !== index),
      );
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const generateRobotsTxt = (data: SitemapRobotFormValues): string => {
    let robotsTxt = '';

    if (data.disallowAll) {
      robotsTxt += 'User-agent: *\nDisallow: /\n';
    } else if (data.allowAll) {
      robotsTxt += 'User-agent: *\nAllow: /\n';
    } else {
      // Custom rules for each user agent
      data.customRules.forEach((agent) => {
        robotsTxt += `User-agent: ${agent.userAgent}\n`;

        agent.rules.forEach((rule) => {
          robotsTxt += `${rule.type}: ${rule.path}\n`;
        });

        if (data.crawlDelay !== undefined && data.crawlDelay > 0) {
          robotsTxt += `Crawl-delay: ${data.crawlDelay}\n`;
        }

        robotsTxt += '\n';
      });
    }

    // Add sitemap URL if enabled
    if (data.sitemap && data.siteUrl) {
      robotsTxt += `Sitemap: ${data.siteUrl.replace(/\/+$/, '')}/sitemap.xml\n`;
    }

    // Add host if enabled
    if (data.host && data.siteUrl) {
      const hostUrl = new URL(data.siteUrl);
      robotsTxt += `Host: ${hostUrl.hostname}\n`;
    }

    return robotsTxt;
  };

  const generateSitemapXml = (data: SitemapRobotFormValues): string => {
    let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add each page
    data.pages.forEach((page) => {
      if (page.url) {
        sitemapXml += '  <url>\n';
        sitemapXml += `    <loc>${page.url}</loc>\n`;

        if (page.lastmod) {
          sitemapXml += `    <lastmod>${page.lastmod}</lastmod>\n`;
        }

        sitemapXml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        sitemapXml += `    <priority>${page.priority}</priority>\n`;
        sitemapXml += '  </url>\n';
      }
    });

    sitemapXml += '</urlset>';

    return sitemapXml;
  };

  const onSubmit = (data: SitemapRobotFormValues) => {
    // Save form data to localStorage
    try {
      localStorage.setItem('sitemapRobotFormValues', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving form data:', error);
    }

    // Generate robots.txt
    const robotsTxt = generateRobotsTxt(data);
    setGeneratedRobotCode(robotsTxt);

    // Generate sitemap.xml
    const sitemapXml = generateSitemapXml(data);
    setGeneratedSitemapCode(sitemapXml);

    setActiveTab('result');
    toast.success(
      `${selectedTab === 'robot' ? 'robots.txt' : 'sitemap.xml'} generated successfully!`,
    );
  };

  const generateAutoUrl = (baseUrl: string, page: number) => {
    if (!baseUrl) return '';
    try {
      const url = new URL(baseUrl);
      if (page === 0) {
        return url.toString().replace(/\/+$/, '');
      } else {
        return `${url.toString().replace(/\/+$/, '')}/page-${page}`;
      }
    } catch {
      return baseUrl;
    }
  };

  const autoFillPages = () => {
    const baseUrl = form.getValues('siteUrl');
    if (!baseUrl) {
      toast.error('Please enter a site URL first');
      return;
    }

    const autoPages: {
      url: string;
      priority: string;
      changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
      lastmod?: string;
    }[] = [
      {
        url: generateAutoUrl(baseUrl, 0),
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${generateAutoUrl(baseUrl, 0)}/about`,
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${generateAutoUrl(baseUrl, 0)}/contact`,
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${generateAutoUrl(baseUrl, 0)}/blog`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: `${generateAutoUrl(baseUrl, 0)}/products`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0],
      },
    ];

    form.setValue('pages', autoPages);
    toast.success('Auto-filled common pages');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {selectedTab === 'robot' ? (
              <>
                <FileCode className="h-5 w-5" /> Robots.txt Generator
              </>
            ) : (
              <>
                <Code className="h-5 w-5" /> Sitemap.xml Generator
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {selectedTab === 'robot'
              ? 'Control how search engines crawl your site with robots.txt'
              : 'Help search engines understand your site structure with sitemap.xml'}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex flex-col gap-4 md:flex-row">
          <Button
            onClick={() => setSelectedTab('robot')}
            variant={selectedTab === 'robot' ? 'default' : 'outline'}
            className="flex-1"
          >
            <FileCode className="mr-2 h-4 w-4" /> robots.txt
          </Button>
          <Button
            onClick={() => setSelectedTab('sitemap')}
            variant={selectedTab === 'sitemap' ? 'default' : 'outline'}
            className="flex-1"
          >
            <Code className="mr-2 h-4 w-4" /> sitemap.xml
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-2">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="result">Generated Code</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-medium">Website Details</h3>

                  <FormField
                    control={form.control}
                    name="siteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Website URL <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your website&apos;s root URL (e.g., https://example.com)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedTab === 'robot' && (
                    <div className="space-y-6">
                      <h3 className="border-b pb-2 text-lg font-medium">Robots.txt Settings</h3>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="allowAll"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Allow all</FormLabel>
                                <FormDescription>
                                  Allow search engines to crawl your entire website
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked) form.setValue('disallowAll', false);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="disallowAll"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Disallow all</FormLabel>
                                <FormDescription>
                                  Block search engines from crawling your entire website
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked) form.setValue('allowAll', false);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {!form.watch('allowAll') && !form.watch('disallowAll') && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Custom Rules</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addUserAgent}
                            >
                              Add User Agent
                            </Button>
                          </div>

                          {form.watch('customRules').map((userAgent, uaIndex) => (
                            <div key={uaIndex} className="space-y-4 rounded-lg border p-4">
                              <div className="flex items-center justify-between">
                                <FormField
                                  control={form.control}
                                  name={`customRules.${uaIndex}.userAgent`}
                                  render={({ field }) => (
                                    <FormItem className="mr-2 flex-1">
                                      <FormLabel>User Agent</FormLabel>
                                      <FormControl>
                                        <Input placeholder="* (all bots) or Googlebot" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {form.watch('customRules').length > 1 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="mt-8"
                                    onClick={() => removeUserAgent(uaIndex)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium">Rules</h5>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addRule(uaIndex)}
                                  >
                                    Add Rule
                                  </Button>
                                </div>

                                {userAgent.rules.map((rule, ruleIndex) => (
                                  <div key={ruleIndex} className="flex items-center gap-2">
                                    <FormField
                                      control={form.control}
                                      name={`customRules.${uaIndex}.rules.${ruleIndex}.type`}
                                      render={({ field }) => (
                                        <FormItem className="w-28">
                                          <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Type" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="Allow">Allow</SelectItem>
                                              <SelectItem value="Disallow">Disallow</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`customRules.${uaIndex}.rules.${ruleIndex}.path`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input placeholder="/path" {...field} />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />

                                    {userAgent.rules.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeRule(uaIndex, ruleIndex)}
                                      >
                                        ×
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          <FormField
                            control={form.control}
                            name="crawlDelay"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Crawl Delay</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Time in seconds that bots should wait between requests (0 to
                                  disable)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="sitemap"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Include Sitemap URL</FormLabel>
                                <FormDescription>Add sitemap.xml URL to robots.txt</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="host"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Include Host directive</FormLabel>
                                <FormDescription>
                                  Specify preferred domain for Yandex
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {selectedTab === 'sitemap' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="border-b pb-2 text-lg font-medium">Sitemap.xml Settings</h3>
                        <Button type="button" variant="outline" size="sm" onClick={autoFillPages}>
                          Auto-fill Common Pages
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {form.watch('pages').map((page, index) => (
                          <div key={index} className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Page {index + 1}</h4>
                              {form.watch('pages').length > 1 && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removePage(index)}
                                >
                                  Remove Page
                                </Button>
                              )}
                            </div>

                            <FormField
                              control={form.control}
                              name={`pages.${index}.url`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://example.com/page" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`pages.${index}.priority`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="0.1">0.1 (Lowest)</SelectItem>
                                        <SelectItem value="0.3">0.3 (Low)</SelectItem>
                                        <SelectItem value="0.5">0.5 (Medium)</SelectItem>
                                        <SelectItem value="0.7">0.7 (High)</SelectItem>
                                        <SelectItem value="1.0">1.0 (Highest)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Relative importance of this page
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`pages.${index}.changefreq`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Change Frequency</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Change Frequency" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="always">always</SelectItem>
                                        <SelectItem value="hourly">hourly</SelectItem>
                                        <SelectItem value="daily">daily</SelectItem>
                                        <SelectItem value="weekly">weekly</SelectItem>
                                        <SelectItem value="monthly">monthly</SelectItem>
                                        <SelectItem value="yearly">yearly</SelectItem>
                                        <SelectItem value="never">never</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>How often this page changes</FormDescription>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`pages.${index}.lastmod`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Modified</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormDescription>Last update date</FormDescription>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={addPage}
                          className="w-full"
                        >
                          Add Another Page
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={clearForm} className="mr-auto">
                    Clear Form
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Generate {selectedTab === 'robot' ? 'robots.txt' : 'sitemap.xml'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Button
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() =>
                    copyToClipboard(
                      selectedTab === 'robot' ? generatedRobotCode : generatedSitemapCode,
                    )
                  }
                >
                  Copy
                </Button>
                <pre className="min-h-[200px] overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm dark:bg-slate-800">
                  {selectedTab === 'robot' ? generatedRobotCode : generatedSitemapCode}
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
                {selectedTab === 'robot' ? (
                  <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300/80">
                    <p>
                      Place the{' '}
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">
                        robots.txt
                      </code>{' '}
                      file in the root directory public folder of your website.
                    </p>
                    <p>
                      The file must be accessible at:{' '}
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">
                        {form.getValues('siteUrl').replace(/\/+$/, '')}/robots.txt
                      </code>
                    </p>
                    <p>
                      Search engines will read this file to determine which parts of your site they
                      are allowed to crawl and index.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300/80">
                    <p>
                      Place the{' '}
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">
                        sitemap.xml
                      </code>{' '}
                      file in the root directory public folder of your website.
                    </p>
                    <p>
                      The file must be accessible at:{' '}
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">
                        {form.getValues('siteUrl').replace(/\/+$/, '')}/sitemap.xml
                      </code>
                    </p>
                    <p>
                      Submit your sitemap URL to Google Search Console and Bing Webmaster Tools to
                      help search engines discover and index your pages.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab('form')}>
                  Edit
                </Button>
                <Button
                  onClick={() =>
                    copyToClipboard(
                      selectedTab === 'robot' ? generatedRobotCode : generatedSitemapCode,
                    )
                  }
                >
                  Copy to Clipboard
                </Button>
                <Button
                  onClick={() => {
                    const blob = new Blob(
                      [selectedTab === 'robot' ? generatedRobotCode : generatedSitemapCode],
                      { type: selectedTab === 'robot' ? 'text/plain' : 'application/xml' },
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = selectedTab === 'robot' ? 'robots.txt' : 'sitemap.xml';
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

// Main component for robots.txt and sitemap.xml generator card
const RobotSitemapGenerator = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-cyan-300 bg-gradient-to-br from-cyan-50 via-white to-cyan-100 p-8 shadow-xl dark:border-cyan-700 dark:from-cyan-900/60 dark:via-cyan-950/80 dark:to-cyan-900/60">
      <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-cyan-200 opacity-30 blur-2xl dark:bg-cyan-800" />
      <div className="absolute -bottom-10 -left-10 z-0 h-32 w-32 rounded-full bg-cyan-100 opacity-20 blur-2xl dark:bg-cyan-900" />

      <h2 className="z-10 mb-3 text-2xl font-extrabold tracking-tight text-cyan-800 drop-shadow-lg dark:text-cyan-100">
        <span className="mr-2 inline-block align-middle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="inline-block text-cyan-500 dark:text-cyan-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        </span>
        Robots.txt & Sitemap Generator
      </h2>

      <p className="z-10 mb-6 max-w-lg text-center text-sm text-cyan-700/80 dark:text-cyan-200/80 md:text-base">
        Create perfect robots.txt and sitemap.xml files for your website to improve SEO and control
        how search engines crawl your site.
      </p>

      <Button
        onClick={() => setShowModal(true)}
        className="z-10 flex items-center gap-2 rounded-xl border-0 bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600 px-8 py-3 text-lg font-bold shadow-lg transition-all duration-200 hover:from-cyan-600 hover:to-sky-600"
        style={{ minWidth: 240 }}
      >
        <ServerIcon className="h-5 w-5" />
        Generate Files
      </Button>

      {showModal && (
        <RobotSitemapGeneratorModal open={showModal} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default RobotSitemapGenerator;
