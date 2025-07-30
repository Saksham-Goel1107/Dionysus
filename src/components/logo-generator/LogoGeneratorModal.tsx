'use client';

import { useState } from 'react';
import { X, Download, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import ColorPicker from './ColorPicker';
import Image from 'next/image';

interface LogoGeneratorModalProps {
  open: boolean;
  onClose: () => void;
}

const LOGO_STYLES = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'modern', label: 'Modern' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'playful', label: 'Playful' },
  { value: 'tech', label: 'Tech-focused' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'bold', label: 'Bold' },
  { value: 'handcrafted', label: 'Hand-crafted' },
];

const LOGO_TYPES = [
  { value: 'wordmark', label: 'Wordmark (Text Only)' },
  { value: 'icon', label: 'Icon Only' },
  { value: 'combination', label: 'Combination (Icon & Text)' },
  { value: 'emblem', label: 'Emblem (Text Inside Shape)' },
  { value: 'mascot', label: 'Mascot' },
  { value: 'lettermark', label: 'Lettermark (Initials)' },
];

const LogoGeneratorModal = ({ open, onClose }: LogoGeneratorModalProps) => {
  const { resolvedTheme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoImages, setLogoImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formState, setFormState] = useState({
    companyName: '',
    industry: '',
    description: '',
    style: 'modern',
    type: 'combination',
    primaryColor: '#3b82f6', // Blue default
    secondaryColor: '#10b981', // Green default
    accentColor: '#f59e0b', // Amber default
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Handle color changes
  const handleColorChange = (name: string, color: string) => {
    setFormState((prev) => ({ ...prev, [name]: color }));
  };

  // Generate the logo
  const generateLogo = async () => {
    if (!formState.companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setIsGenerating(true);
    try {
      // Build the prompt with all customization options
      const prompt = `
        Create a ${formState.style} ${formState.type} logo for a ${formState.industry} company called "${formState.companyName}". 
        ${formState.description ? `The company/brand is about: ${formState.description}.` : ''} 
        Use these colors: primary (${formState.primaryColor}), secondary (${formState.secondaryColor}), 
        and accent (${formState.accentColor}) color scheme. 
        The logo should look professional, scalable, and work well both in color and monochrome.
        High quality, vector-style, clean background.
      `;

      // Call the API
      const response = await fetch('/api/logo-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate logo');
      }

      const data = await response.json();
      // Store the generated logo in the array
      if (data.imageUrl) {
        setLogoImages([data.imageUrl]);
        setCurrentImageIndex(0);
        toast.success('Logo generated successfully!');
      } else {
        throw new Error('No logo image received');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate logo');
      console.error('Logo generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download the generated logo
  const downloadLogo = () => {
    if (!logoImages.length || currentImageIndex >= logoImages.length) return;

    const link = document.createElement('a');
    link.href = logoImages[currentImageIndex] ?? '';
    link.download = `${formState.companyName.replace(/\s+/g, '-').toLowerCase()}-logo-${currentImageIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logo downloaded!');
  };

  // Navigation functions for the image carousel
  const nextImage = () => {
    if (logoImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % logoImages.length);
    }
  };

  const prevImage = () => {
    if (logoImages.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? logoImages.length - 1 : prev - 1));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <div className="flex items-center gap-3 pr-3">
              <Image src={'/logo.png'} height={40} width={40} alt="Logo" />
              <span className="font-extrabold">Dionysus</span>
            </div>
            Logo Generator
          </DialogTitle>
          <DialogDescription>
            Create a professional logo for your brand with AI. Customize style, colors, and more.
            <br />
            Each Logo Genration Costs <strong>5 Credits</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
          {/* Left side - Form */}
          <div className="space-y-5">
            <Tabs defaultValue="basics" className="w-full">
              <TabsList className="mb-4 grid grid-cols-3">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
              </TabsList>

              {/* Basics Tab */}
              <TabsContent value="basics" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company/Brand Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formState.companyName}
                    onChange={handleInputChange}
                    placeholder="E.g., Dionysus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formState.industry}
                    onChange={handleInputChange}
                    placeholder="E.g., Technology, Restaurant, Fashion"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Brand Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    placeholder="Describe what your brand represents, your values, or target audience..."
                    rows={4}
                  />
                </div>
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Type</Label>
                  <Select
                    value={formState.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a logo type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGO_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Visual Style</Label>
                  <RadioGroup
                    value={formState.style}
                    onValueChange={(value) => handleSelectChange('style', value)}
                    className="grid grid-cols-2 gap-2"
                  >
                    {LOGO_STYLES.map((style) => (
                      <div key={style.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={style.value} id={`style-${style.value}`} />
                        <Label htmlFor={`style-${style.value}`}>{style.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="space-y-4">
                <div className="space-y-3">
                  <Label>Primary Color</Label>
                  <ColorPicker
                    color={formState.primaryColor}
                    onChange={(color) => handleColorChange('primaryColor', color)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Secondary Color</Label>
                  <ColorPicker
                    color={formState.secondaryColor}
                    onChange={(color) => handleColorChange('secondaryColor', color)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Accent Color</Label>
                  <ColorPicker
                    color={formState.accentColor}
                    onChange={(color) => handleColorChange('accentColor', color)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={generateLogo} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate Logo</>
              )}
            </Button>
          </div>

          {/* Right side - Preview */}
          <div
            className={`flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-6 ${resolvedTheme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-300 bg-gray-50'}`}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin" />
                <p className="text-lg font-medium">Creating your logo...</p>
                <p className="mt-2 text-sm text-muted-foreground">This may take a moment</p>
              </div>
            ) : logoImages.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-4 w-full">
                  {/* Image carousel container */}
                  <div className="flex items-center justify-center">
                    {/* Navigation arrows */}
                    {logoImages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-0 z-10 bg-background/80 hover:bg-background/90"
                        onClick={prevImage}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                        <span className="sr-only">Previous</span>
                      </Button>
                    )}

                    {/* Logo image */}
                    <Image
                      src={logoImages[currentImageIndex] ?? ''}
                      alt={`Generated logo ${currentImageIndex + 1}`}
                      className="max-h-[300px] max-w-full rounded-md object-contain shadow-md"
                    />

                    {/* Navigation arrows */}
                    {logoImages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 z-10 bg-background/80 hover:bg-background/90"
                        onClick={nextImage}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <span className="sr-only">Next</span>
                      </Button>
                    )}
                  </div>

                  {/* Image counter if multiple images */}
                  {logoImages.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                      <div className="rounded-full bg-background/80 px-2 py-1 text-xs">
                        {currentImageIndex + 1} / {logoImages.length}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={generateLogo}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button size="sm" onClick={downloadLogo}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className={`mb-4 rounded-full p-4 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}
                >
                  <ImageIcon className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-lg font-medium">Your logo will appear here</p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Fill in the details on the left and click &apos;Generate Logo&apos;
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Generated logos are royalty-free for personal and commercial use
          </p>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogoGeneratorModal;
