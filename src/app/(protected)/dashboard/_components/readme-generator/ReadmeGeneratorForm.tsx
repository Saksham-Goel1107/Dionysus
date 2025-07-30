'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useProject from '@/hooks/use-project';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoIcon, Copy, Download, Youtube, Code, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import './readme-preview.css';
import Link from 'next/link';

// Define types for README form data
interface ReadmeFormData {
  projectName: string;
  projectDescription: string;
  projectTags: string;
  projectLicense: string;
  projectLink: string;
  projectDemoLink: string;
  installationSteps: string;
  usageInstructions: string;
  features: string;
  technologies: string;
  includeContributing: boolean;
  includeTwitter: boolean;
  twitterUsername: string;
  includeLinkedIn: boolean;
  linkedInUsername: string;
  includeScreenshots: boolean;
  screenshotLinks: string;
}

// Initial form data
const initialFormData: ReadmeFormData = {
  projectName: '',
  projectDescription: '',
  projectTags: '',
  projectLicense: 'MIT',
  projectLink: '',
  projectDemoLink: '',
  installationSteps: '',
  usageInstructions: '',
  features: '',
  technologies: '',
  includeContributing: true,
  includeTwitter: false,
  twitterUsername: '',
  includeLinkedIn: false,
  linkedInUsername: '',
  includeScreenshots: false,
  screenshotLinks: '',
};

// Available licenses
const licenses = [
  { value: 'MIT', label: 'MIT License' },
  { value: 'Apache-2.0', label: 'Apache License 2.0' },
  { value: 'GPL-3.0', label: 'GNU General Public License v3.0' },
  { value: 'BSD-3-Clause', label: 'BSD 3-Clause License' },
  { value: 'NONE', label: 'No License' },
];

interface ReadmeGeneratorFormProps {
  hasProPlan: boolean;
}

export default function ReadmeGeneratorForm() {
  const { project } = useProject();
  const [formData, setFormData] = useState<ReadmeFormData>(initialFormData);
  const [generatedReadme, setGeneratedReadme] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('form');
  const [generationMethod, setGenerationMethod] = useState<'manual' | 'ai'>('manual');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isCurrentProject, setIsCurrentProject] = useState(false);
  const [isFormEmpty, setIsFormEmpty] = useState(true); // Track form emptiness
  const [showProPrompt, setShowProPrompt] = useState(false);
  const [hasProPlan, sethasProPlan] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/pro-status');
        if (!res.ok) throw new Error('Failed to fetch pro status');
        const data = await res.json();
        sethasProPlan(data.pro);
      } catch (error) {
        sethasProPlan(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Compare current form data with initial form data
    const isDefault = (key: keyof ReadmeFormData): boolean => {
      // For checkboxes, compare directly with initial values
      if (typeof formData[key] === 'boolean') {
        return formData[key] === initialFormData[key];
      }
      // For strings, compare trimmed values
      return (
        typeof formData[key] === 'string' &&
        (formData[key] as string).trim() === (initialFormData[key] as string).trim()
      );
    };

    // Check if any field differs from its initial value
    const isModified = Object.keys(formData).some((key) => !isDefault(key as keyof ReadmeFormData));

    // Or check if text fields have content
    const hasContent =
      formData.projectName.trim() !== '' ||
      formData.projectDescription.trim() !== '' ||
      formData.projectLink.trim() !== '' ||
      formData.projectDemoLink.trim() !== '' ||
      formData.features.trim() !== '' ||
      formData.technologies.trim() !== '' ||
      formData.installationSteps.trim() !== '' ||
      formData.usageInstructions.trim() !== '' ||
      formData.projectTags.trim() !== '';

    setIsFormEmpty(!hasContent && !isModified);
  }, [formData]);

  // Auto-fill form with current project data
  const populateFromCurrentProject = () => {
    if (!project) {
      toast.error('No project is currently selected');
      return;
    }

    let repoName = '';
    let repoOwner = '';
    try {
      const url = new URL(project.githubUrl);
      const pathSegments = url.pathname.split('/').filter(Boolean);

      if (pathSegments.length >= 2) {
        repoOwner = pathSegments[0] || '';
        repoName = pathSegments[1] || '';
      }
    } catch (error) {
      console.error('Invalid GitHub URL:', error);
    }

    setFormData({
      ...formData,
      projectName: project.name || repoName,
      projectLink: project.githubUrl,
      // Pre-fill typical values for the current project
      projectDescription: `${project.name} is a GitHub project that...`,
      technologies: 'React, Next.js, TypeScript', // Default modern stack, user can edit
    });

    setIsCurrentProject(true);
    setIsFormEmpty(false);
    toast.success('Form populated with current project data. Please fill in remaining details.');
  };
  // Clear the form data
  const clearForm = () => {
    // Create a fresh copy of initialFormData to ensure complete reset
    const freshFormData = { ...initialFormData };
    setFormData(freshFormData);
    setIsCurrentProject(false);
    setIsFormEmpty(true);
    toast.success('Form cleared. You can now create a README for another project.');
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }; // Generate README markdown using selected method
  const generateReadme = async () => {
    setIsGenerating(true);

    try {
      // Basic validation
      if (!formData.projectName || !formData.projectDescription) {
        toast.error('Please provide at least a project name and description');
        setIsGenerating(false);
        return;
      }
      if (generationMethod === 'ai') {
        await generateAiReadme();
      } else {
        await generateManualReadme();
      }

      setActiveTab('preview');

      if (isCurrentProject) {
        toast.success(`README for ${project?.name} generated successfully!`);
      } else {
        toast.success('README generated successfully!');
      }
    } catch (error) {
      console.error('Error generating README:', error);
      toast.error('Failed to generate README. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate README using AI
  const generateAiReadme = async () => {
    setIsAiGenerating(true);

    try {
      const response = await fetch('/api/readme-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate README with AI');
      }

      const data = await response.json();
      setGeneratedReadme(data.content);
    } catch (error) {
      console.error('AI README generation error:', error);
      throw error;
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Generate README manually
  const generateManualReadme = async () => {
    // Split tags, features, and technologies into arrays
    const tags = formData.projectTags.split(',').map((tag) => tag.trim());
    const features = formData.features.split('\n').filter((f) => f.trim() !== '');
    const technologies = formData.technologies.split(',').map((tech) => tech.trim());
    const installationSteps = formData.installationSteps
      .split('\n')
      .filter((step) => step.trim() !== '');
    const usageInstructions = formData.usageInstructions
      .split('\n')
      .filter((instr) => instr.trim() !== '');
    const screenshotLinks = formData.screenshotLinks
      .split('\n')
      .filter((link) => link.trim() !== '');

    // Generate badges based on technologies
    const techBadges = technologies
      .map((tech) => {
        const techLower = tech.toLowerCase();

        // Map common technologies to badges
        const badgeMap: Record<string, string> = {
          react:
            '![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)',
          javascript:
            '![JavaScript](https://img.shields.io/badge/JavaScript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)',
          typescript:
            '![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)',
          node: '![NodeJS](https://img.shields.io/badge/Node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)',
          nextjs:
            '![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)',
          tailwind:
            '![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)',
          mongodb:
            '![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)',
          postgresql:
            '![Postgres](https://img.shields.io/badge/PostgreSQL-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)',
          prisma:
            '![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)',
        };

        // Return badge if found, otherwise create a generic one
        for (const [key, badge] of Object.entries(badgeMap)) {
          if (techLower.includes(key)) {
            return badge;
          }
        }

        // Generic badge for other technologies
        return `![${tech}](https://img.shields.io/badge/${tech.replace(/\s/g, '%20')}-%23007ACC.svg?style=for-the-badge)`;
      })
      .join(' ');

    // Create license badge
    let licenseBadge = '';
    if (formData.projectLicense !== 'NONE') {
      licenseBadge = `![License](https://img.shields.io/badge/License-${formData.projectLicense.replace(/-/g, '%20')}-blue.svg)`;
    }

    // Build the README content
    let readmeContent = `# ${formData.projectName}\n\n`;

    // Add badges section
    readmeContent += `\n\n`;
    if (licenseBadge) {
      readmeContent += `${licenseBadge} `;
    }
    readmeContent += `![Stars](https://img.shields.io/github/stars/${formData.projectLink.replace('https://github.com/', '')}?style=social) `;
    readmeContent += `![Forks](https://img.shields.io/github/forks/${formData.projectLink.replace('https://github.com/', '')}?style=social) `;
    readmeContent += `![Issues](https://img.shields.io/github/issues/${formData.projectLink.replace('https://github.com/', '')})\n\n`;
    readmeContent += `\n\n`;

    // Add description
    readmeContent += `## 📝 Description\n\n${formData.projectDescription}\n\n`;

    // Add tags if provided
    if (tags.length > 0 && tags[0] !== '') {
      readmeContent += `## 🏷️ Tags\n\n`;
      tags.forEach((tag) => {
        readmeContent += `\`${tag}\` `;
      });
      readmeContent += `\n\n`;
    }

    // Add screenshots if enabled
    if (formData.includeScreenshots && screenshotLinks.length > 0) {
      readmeContent += `## 📸 Screenshots\n\n`;
      screenshotLinks.forEach((link, index) => {
        readmeContent += `<img src="${link}" alt="Screenshot ${index + 1}" width="600"/>\n\n`;
      });
    }

    // Add demo link if provided
    if (formData.projectDemoLink) {
      readmeContent += `## 🔗 Demo\n\n`;
      readmeContent += `Check out the live demo: [Live Demo](${formData.projectDemoLink})\n\n`;
    }

    // Add tech stack if provided
    if (technologies.length > 0 && technologies[0] !== '') {
      readmeContent += `## 🛠️ Technologies\n\n`;
      readmeContent += `${techBadges}\n\n`;
    }

    // Add features if provided
    if (features.length > 0 && features[0] !== '') {
      readmeContent += `## ✨ Features\n\n`;
      features.forEach((feature) => {
        readmeContent += `- ${feature}\n`;
      });
      readmeContent += `\n`;
    }

    // Add installation steps if provided
    if (installationSteps.length > 0 && installationSteps[0] !== '') {
      readmeContent += `## 🚀 Installation\n\n`;
      readmeContent += '```bash\n';
      installationSteps.forEach((step) => {
        readmeContent += `${step}\n`;
      });
      readmeContent += '```\n\n';
    }

    // Add usage instructions if provided
    if (usageInstructions.length > 0 && usageInstructions[0] !== '') {
      readmeContent += `## 📖 Usage\n\n`;
      usageInstructions.forEach((instruction) => {
        readmeContent += `${instruction}\n\n`;
      });
    }

    // Add contributing section if enabled
    if (formData.includeContributing) {
      readmeContent += `## 🤝 Contributing\n\n`;
      readmeContent += `Contributions, issues and feature requests are welcome!\n\n`;
      readmeContent += `Feel free to check [issues page](${formData.projectLink}/issues).\n\n`;
    }

    // Add license section
    if (formData.projectLicense !== 'NONE') {
      readmeContent += `## 📄 License\n\n`;
      readmeContent += `This project is [${formData.projectLicense}](https://opensource.org/licenses/${formData.projectLicense}) licensed.\n\n`;
    }

    // Add social links if enabled
    readmeContent += `## 👨‍💻 Author\n\n`;

    if (formData.includeTwitter && formData.twitterUsername) {
      readmeContent += `- Twitter: [@${formData.twitterUsername}](https://twitter.com/${formData.twitterUsername})\n`;
    }

    if (formData.includeLinkedIn && formData.linkedInUsername) {
      readmeContent += `- LinkedIn: [${formData.linkedInUsername}](https://linkedin.com/in/${formData.linkedInUsername})\n`;
    }

    readmeContent += `\n---\n\n`;
    readmeContent += `<p align="center">⭐ If you found this project helpful, please consider giving it a star! ⭐</p>\n`;

    // Set the generated README
    setGeneratedReadme(readmeContent);
  };

  // Copy README to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReadme);
    toast.success('README copied to clipboard!');
  };

  // Download README as markdown file
  const downloadReadme = () => {
    const blob = new Blob([generatedReadme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('README downloaded!');
  };
  return (
    <Card className="mx-auto w-full sm:max-w-3xl">
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
          <div>
            <CardTitle className="text-2xl">README Generator</CardTitle>
            <CardDescription>
              Create a beautiful and comprehensive README for your project
            </CardDescription>
          </div>
          <div className="mt-2 flex w-full gap-2 sm:mt-0 sm:w-auto">
            {project && !isCurrentProject && (
              <Button
                onClick={populateFromCurrentProject}
                variant="outline"
                className="w-full gap-2 border-black dark:border-white sm:w-auto"
              >
                Use Current Project
              </Button>
            )}
            {!isFormEmpty && (
              <Button
                onClick={clearForm}
                variant="outline"
                className="w-full gap-2 border-red-500 text-red-500 hover:bg-red-500/10 dark:border-red-700 dark:text-red-400 sm:w-auto"
              >
                Clear Form
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mx-0 grid grid-cols-3 sm:mx-6">
          <TabsTrigger value="form" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Form</span>
          </TabsTrigger>
          <TabsTrigger value="code" disabled={!generatedReadme} className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            <span>Markdown</span>
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            disabled={!generatedReadme}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                {isCurrentProject && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Form populated with data from: <strong>{project?.name}</strong>
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-4 sm:flex-nowrap">
                  <Label className="mr-2 whitespace-nowrap">Generation Method:</Label>
                  <div className="mt-2 flex w-full overflow-hidden rounded-md border sm:mt-0 sm:w-auto sm:min-w-0 sm:whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setGenerationMethod('manual')}
                      className={`px-4 py-2 text-sm ${
                        generationMethod === 'manual'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background'
                      }`}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasProPlan) {
                          setGenerationMethod('ai');
                        } else {
                          setShowProPrompt(true);
                        }
                      }}
                      className={`px-4 py-2 text-sm ${
                        generationMethod === 'ai'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background'
                      }`}
                    >
                      AI-Powered
                    </button>
                  </div>
                  {generationMethod === 'ai' && (
                    <p className="mt-2 text-xs text-muted-foreground sm:mt-0">
                      AI will generate a comprehensive README based on your input
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name*</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  placeholder="e.g. Awesome Project"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Description*</Label>
                <Textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleInputChange}
                  placeholder="Describe what your project does, what problem it solves, etc."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectLink">GitHub Repository URL</Label>
                  <Input
                    id="projectLink"
                    name="projectLink"
                    value={formData.projectLink}
                    onChange={handleInputChange}
                    placeholder="e.g. https://github.com/username/repo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectLicense">License</Label>
                  <Select
                    value={formData.projectLicense}
                    onValueChange={(value) => handleSelectChange('projectLicense', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a license" />
                    </SelectTrigger>
                    <SelectContent>
                      {licenses.map((license) => (
                        <SelectItem key={license.value} value={license.value}>
                          {license.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="basic">
                  <AccordionTrigger>Basic Information</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectTags">Tags (comma separated)</Label>
                      <Input
                        id="projectTags"
                        name="projectTags"
                        value={formData.projectTags}
                        onChange={handleInputChange}
                        placeholder="e.g. react, typescript, web-app"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectDemoLink">Demo Link</Label>
                      <Input
                        id="projectDemoLink"
                        name="projectDemoLink"
                        value={formData.projectDemoLink}
                        onChange={handleInputChange}
                        placeholder="e.g. https://my-project-demo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="technologies">Technologies (comma separated)</Label>
                      <Input
                        id="technologies"
                        name="technologies"
                        value={formData.technologies}
                        onChange={handleInputChange}
                        placeholder="e.g. React, TypeScript, Node.js"
                      />
                      <p className="text-sm text-muted-foreground">
                        Common technologies will get nice badges automatically!
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="features">
                  <AccordionTrigger>Features & Instructions</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="features">Features (one per line)</Label>
                      <Textarea
                        id="features"
                        name="features"
                        value={formData.features}
                        onChange={handleInputChange}
                        placeholder="e.g. User authentication\nDark mode support\nReal-time notifications"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="installationSteps">Installation Steps (one per line)</Label>
                      <Textarea
                        id="installationSteps"
                        name="installationSteps"
                        value={formData.installationSteps}
                        onChange={handleInputChange}
                        placeholder="e.g. git clone https://github.com/username/repo\ncd repo\nnpm install\nnpm start"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="usageInstructions">Usage Instructions</Label>
                      <Textarea
                        id="usageInstructions"
                        name="usageInstructions"
                        value={formData.usageInstructions}
                        onChange={handleInputChange}
                        placeholder="Instructions on how to use your project"
                        rows={4}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="media">
                  <AccordionTrigger>Images & Social</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeScreenshots"
                        name="includeScreenshots"
                        checked={formData.includeScreenshots}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="includeScreenshots">Include Screenshots</Label>
                    </div>

                    {formData.includeScreenshots && (
                      <div className="space-y-2">
                        <Label htmlFor="screenshotLinks">Screenshot URLs (one per line)</Label>
                        <Textarea
                          id="screenshotLinks"
                          name="screenshotLinks"
                          value={formData.screenshotLinks}
                          onChange={handleInputChange}
                          placeholder="e.g. https://example.com/screenshot1.png\nhttps://example.com/screenshot2.png"
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeTwitter"
                        name="includeTwitter"
                        checked={formData.includeTwitter}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="includeTwitter">Include Twitter</Label>
                    </div>

                    {formData.includeTwitter && (
                      <div className="space-y-2">
                        <Label htmlFor="twitterUsername">Twitter Username (without @)</Label>
                        <Input
                          id="twitterUsername"
                          name="twitterUsername"
                          value={formData.twitterUsername}
                          onChange={handleInputChange}
                          placeholder="e.g. username"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeLinkedIn"
                        name="includeLinkedIn"
                        checked={formData.includeLinkedIn}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="includeLinkedIn">Include LinkedIn</Label>
                    </div>

                    {formData.includeLinkedIn && (
                      <div className="space-y-2">
                        <Label htmlFor="linkedInUsername">LinkedIn Username</Label>
                        <Input
                          id="linkedInUsername"
                          name="linkedInUsername"
                          value={formData.linkedInUsername}
                          onChange={handleInputChange}
                          placeholder="e.g. username"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeContributing"
                        name="includeContributing"
                        checked={formData.includeContributing}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="includeContributing">Include Contributing Section</Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col flex-wrap items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => {
                window.open('https://youtu.be/5JoEB2YTlpw?si=X5JX8Xd_8ERLXJhG', '_blank');
              }}
              className="w-full gap-2 sm:w-auto"
            >
              <Youtube size={16} />
              How to write a good README
            </Button>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button onClick={generateReadme} disabled={isGenerating} className="w-full sm:w-auto">
                {isGenerating
                  ? generationMethod === 'ai'
                    ? 'AI is working...'
                    : 'Generating...'
                  : generationMethod === 'ai'
                    ? 'Generate AI README'
                    : 'Generate README'}
              </Button>
            </div>
          </CardFooter>
        </TabsContent>
        <TabsContent value="code">
          <CardContent>
            <div className="mb-4 flex flex-col justify-end space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
              <Button
                variant="outline"
                onClick={() => setActiveTab('form')}
                className="w-full gap-2 sm:w-auto"
              >
                <FileText size={16} />
                Edit Form
              </Button>
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="w-full gap-2 sm:w-auto"
              >
                <Copy size={16} />
                Copy
              </Button>
              <Button variant="outline" onClick={downloadReadme} className="w-full gap-2 sm:w-auto">
                <Download size={16} />
                Download README.md
              </Button>
            </div>
            <div className="overflow-x-auto rounded-md bg-muted p-2 sm:p-4">
              <div className="space-y-4">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                  <h3 className="text-xl font-semibold">Markdown Code</h3>
                  <p className="text-xs text-muted-foreground">
                    Edit markdown directly and see changes in preview
                  </p>
                </div>
                <Textarea
                  className="min-h-[300px] resize-y bg-background font-mono text-sm sm:min-h-[500px]"
                  value={generatedReadme}
                  onChange={(e) => setGeneratedReadme(e.target.value)}
                  spellCheck="false"
                  placeholder="Your markdown code will appear here. You can edit it directly."
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Resources to Improve Your README</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <a
                  href="https://youtu.be/5JoEB2YTlpw?si=X5JX8Xd_8ERLXJhG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <Youtube className="mr-2" size={20} />
                  <span>How to Write a Good README</span>
                </a>
                <a
                  href="https://shields.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <InfoIcon className="mr-2" size={20} />
                  <span>Create Custom Badges with Shields.io</span>
                </a>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="default" onClick={downloadReadme} className="w-full gap-2">
              <Download size={16} />
              Download README.md
            </Button>
          </CardFooter>
        </TabsContent>
        <TabsContent value="preview">
          <CardContent>
            <div className="mb-4 flex flex-col justify-end space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
              <Button
                variant="outline"
                onClick={() => setActiveTab('code')}
                className="w-full gap-2 sm:w-auto"
              >
                <Code size={16} />
                View Markdown
              </Button>
              <Button variant="outline" onClick={downloadReadme} className="w-full gap-2 sm:w-auto">
                <Download size={16} />
                Download
              </Button>
            </div>
            <div className="mb-4 overflow-x-auto rounded-md border bg-white p-2 shadow-sm dark:bg-gray-900 sm:p-6">
              <div className="prose dark:prose-invert readme-preview max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {generatedReadme}
                </ReactMarkdown>
              </div>
            </div>
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 dark:border-yellow-900/50 dark:bg-yellow-900/20 sm:p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> The actual appearance on GitHub may differ slightly from this
                preview. And believe me it will be much better there then here.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="default" onClick={downloadReadme} className="w-full gap-2">
              <Download size={16} />
              Download README.md
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
      {showProPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="w-full max-w-sm rounded-lg border bg-white p-4 text-center shadow-lg dark:bg-gray-900 sm:p-8">
            <h2 className="mb-2 text-xl font-bold text-yellow-700">Pro Required</h2>
            <p className="mb-4 text-muted-foreground">
              Upgrade to <span className="font-semibold">Pro</span> to unlock AI-powered README
              generation.
            </p>
            <Link href="/subscriptions">
              <Button className="mb-2 w-full">Get Pro</Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={() => setShowProPrompt(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
