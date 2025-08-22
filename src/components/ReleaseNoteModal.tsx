'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bug, Calendar, ChevronRight, GitBranch, Shield, Sparkles, Star, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ReleaseNote {
  id: number;
  version: string;
  title: string;
  date: string;
  type: 'major' | 'minor' | 'patch' | string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
  breaking?: string[];
  highlights?: string[];
}

const LOCALSTORAGE_KEY = 'dionysus-release-note-version';

const RELEASE_NOTES: ReleaseNote[] = [
  {
    id: 1,
    version: '0.1.0',
    title: 'Enhanced Analytics & AI Features',
    date: '2025-08-20',
    type: 'minor',
    highlights: [
      'AI-powered code review suggestions',
      'Advanced repository health metrics',
      'Real-time collaboration features',
    ],
    features: [
      'Automated Code Review with AI-powered suggestions',
      'Repository Health Dashboard with comprehensive metrics',
      'Team Activity Analytics and performance insights',
      'Smart Meeting Summaries with action item extraction',
      'AI-powered semantic search across codebase',
      'Custom metrics and KPI tracking',
      'Release analytics and adoption tracking',
    ],
    improvements: [
      'Enhanced security scanning with real-time alerts',
      'Improved onboarding flow with progress tracking',
      'Better notification system with fine-grained controls',
      'Optimized performance for large repositories',
      'Updated UI/UX with dark mode improvements',
    ],
    bugFixes: [
      'Fixed transcription accuracy for audio files',
      'Resolved memory leaks in real-time updates',
      'Fixed authentication issues with GitHub integration',
      'Corrected timezone handling in analytics',
    ],
  },
];
export const ReleaseNoteModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentRelease, setCurrentRelease] = useState<ReleaseNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/client-version.json');
        const versionData: { releaseNoteVersion: number } = await response.json();
        const storedVersionRaw = localStorage.getItem(LOCALSTORAGE_KEY);
        if (storedVersionRaw === null) {
          localStorage.setItem(LOCALSTORAGE_KEY, String(versionData.releaseNoteVersion));
          setLoading(false);
          return;
        }
        const storedVersion = Number(storedVersionRaw);
        if (storedVersion < versionData.releaseNoteVersion) {
          const latestRelease = RELEASE_NOTES[0];
          if (latestRelease) {
            setCurrentRelease(latestRelease);
            setOpen(true);
          }
        }
      } catch (error) {
        console.error('Failed to check version:', error);
      } finally {
        setLoading(false);
      }
    };
    checkVersion();
  }, []);

  const handleClose = () => {
    fetch('/client-version.json')
      .then((res) => res.json())
      .then((versionData: { releaseNoteVersion: number }) => {
        localStorage.setItem(LOCALSTORAGE_KEY, String(versionData.releaseNoteVersion));
      })
      .catch(() => {
        localStorage.setItem(LOCALSTORAGE_KEY, String(currentRelease?.id || 1));
      });

    setOpen(false);
    toast.success('Welcome to the latest version of Dionysus!');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <Star className="h-4 w-4" />;
      case 'minor':
        return <Zap className="h-4 w-4" />;
      case 'patch':
        return <Bug className="h-4 w-4" />;
      default:
        return <GitBranch className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'minor':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'patch':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading || !currentRelease) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-blue-400 scrollbar-track-blue-100 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-blue-900 h-auto max-h-[96vh] w-full max-w-[98vw] overflow-y-auto p-2 sm:max-w-[90vw] sm:p-4 md:max-w-[700px] md:p-6 lg:max-w-[900px] xl:max-w-[1100px] 2xl:max-w-[1200px]"
        style={{ boxSizing: 'border-box' }}
      >
        <DialogHeader className="space-y-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold leading-tight sm:text-lg md:text-xl">
                  {currentRelease.title}
                </DialogTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getTypeColor(currentRelease.type)}>
                    {getTypeIcon(currentRelease.type)}
                    <span className="ml-1 capitalize">{currentRelease.type}</span>
                  </Badge>
                  <Badge variant="secondary">v{currentRelease.version}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(currentRelease.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {currentRelease.highlights && (
            <div className="mt-4 rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300 sm:text-base">
                  Highlights
                </span>
              </div>
              <ul className="space-y-1">
                {currentRelease.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-purple-500" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-blue-400 scrollbar-track-blue-100 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-blue-900 max-h-[40vh] overflow-y-auto pr-2 sm:max-h-[50vh] sm:pr-4 md:max-h-[60vh]">
          <div className="space-y-6">
            {/* New Features */}
            {currentRelease.features.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 sm:text-base">
                    New Features
                  </h4>
                </div>
                <ul className="space-y-2">
                  {currentRelease.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {currentRelease.improvements.length > 0 && (
              <div>
                <Separator />
                <div className="mb-3 mt-6 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 sm:text-base">
                    Improvements
                  </h4>
                </div>
                <ul className="space-y-2">
                  {currentRelease.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bug Fixes */}
            {currentRelease.bugFixes.length > 0 && (
              <div>
                <Separator />
                <div className="mb-3 mt-6 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 sm:text-base">
                    Bug Fixes
                  </h4>
                </div>
                <ul className="space-y-2">
                  {currentRelease.bugFixes.map((fix, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Breaking Changes */}
            {currentRelease.breaking && currentRelease.breaking.length > 0 && (
              <div>
                <Separator />
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 sm:p-3">
                  <ul className="space-y-2">
                    {currentRelease.breaking.map((change, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                        <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="w-full flex-col gap-2 sm:flex-row">
          <Button onClick={handleClose} className="w-full text-sm sm:w-auto sm:text-base">
            <Sparkles className="mr-2 h-4 w-4" />
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseNoteModal;
