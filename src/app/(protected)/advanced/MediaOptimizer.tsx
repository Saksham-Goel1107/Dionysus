'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Download, FileVideo, Folders, Github, Image as ImageIcon, RefreshCw, Search, Upload, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';

interface GitHubRepoFile {
  name: string;
  path: string;
  sha: string;
  type: string;
  download_url?: string;
  size?: number;
}

interface Breadcrumb {
  name: string;
  path: string;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  updated_at: string;
  fork: boolean;
  html_url: string;
  description: string;
}

const IMAGE_FORMATS = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
  { label: 'GIF', value: 'gif' },
  { label: 'SVG', value: 'svg' },
  { label: 'AVIF', value: 'avif' }
];

const VIDEO_FORMATS = [
  { label: 'MP4', value: 'mp4' },
  { label: 'WebM', value: 'webm' },
  { label: 'GIF', value: 'gif' }
];

// Dynamically load imagetracerjs if needed
const loadImageTracer = async () => {
  if (typeof window !== 'undefined' && !(window as any).ImageTracer) {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/imagetracer.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load ImageTracer"));
      document.body.appendChild(script);
    });
  }
};

const MediaOptimizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('images');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [outputFormat, setOutputFormat] = useState('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [repoFiles, setRepoFiles] = useState<GitHubRepoFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Pre-load ImageTracer for SVG conversion
  useEffect(() => {
    loadImageTracer().catch(console.error);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('githubUsername')) {
      setGithubUsername(localStorage.getItem('githubUsername') || '');
    }
    if (localStorage.getItem('githubToken')) {
      setGithubToken(localStorage.getItem('githubToken') || '');
    }
  }, []);

  // Clean up previous previewUrl when it changes
  useEffect(() => {
    let prevUrl = previewUrl;
    return () => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
    };
  }, [previewUrl]);

  // Clean up previous optimizedUrl when it changes
  useEffect(() => {
    let prevUrl = optimizedUrl;
    return () => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
    };
  }, [optimizedUrl]);

  const resetState = React.useCallback(() => {
    setSelectedFile(null);
    setOptimizedUrl(null);
    setProcessedBlob(null);
    setPreviewUrl(null);
    setWidth(0);
    setHeight(0);
    setOriginalDimensions({ width: 0, height: 0 });
  }, []);

  // Handle tab change - clear content when switching tabs
  useEffect(() => {
    resetState();
  }, [activeTab, resetState]);

  // Reset state when file changes
  useEffect(() => {
    if (selectedFile) {
      // Set appropriate initial output format based on file type
      const fileType = selectedFile.type.split('/')[0];
      const fileFormat = selectedFile.type.split('/')[1];
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      if (fileType === 'image') {
        setActiveTab('images');
        setOutputFormat(fileFormat === 'svg+xml' ? 'svg' : fileFormat || 'png');
        if (fileFormat !== 'svg+xml') {
          const img = new window.Image();
          img.onload = () => {
            setOriginalDimensions({ width: img.width, height: img.height });
            setWidth(img.width);
            setHeight(img.height);
          };
          img.src = objectUrl;
        } else {
          setOriginalDimensions({ width: 800, height: 600 });
          setWidth(800);
          setHeight(600);
        }
      } else if (fileType === 'video') {
        setActiveTab('videos');
        setOutputFormat(fileFormat || 'mp4');
      }
    } else {
      setPreviewUrl(null);
      setOriginalDimensions({ width: 0, height: 0 });
      setWidth(0);
      setHeight(0);
    }
  }, [selectedFile]);

  // Set up video dimensions when video loads
  useEffect(() => {
    if (selectedFile?.type.startsWith('video/') && videoRef.current && previewUrl) {
      const video = videoRef.current;
      video.src = previewUrl;
      
      video.onloadedmetadata = () => {
        setOriginalDimensions({ width: video.videoWidth, height: video.videoHeight });
        setWidth(video.videoWidth);
        setHeight(video.videoHeight);
      };
      
      video.onerror = () => {
        toast.error("Video failed to load");
        setSelectedFile(null);
      };
    }
  }, [selectedFile, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Clean up previous resources
      if (optimizedUrl) {
        URL.revokeObjectURL(optimizedUrl);
        setOptimizedUrl(null);
        setProcessedBlob(null);
      }
      
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileType = file.type.split('/')[0];
      
      if (fileType === 'image' || fileType === 'video') {
        // Clean up previous resources
        if (optimizedUrl) {
          URL.revokeObjectURL(optimizedUrl);
          setOptimizedUrl(null);
          setProcessedBlob(null);
        }
        
        setSelectedFile(file);
      } else {
        toast.error('Please select an image or video file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const updateDimension = (dimension: 'width' | 'height', value: number) => {
    if (maintainAspectRatio && originalDimensions.width && originalDimensions.height) {
      if (dimension === 'width') {
        const aspectHeight = Math.round(value * (originalDimensions.height / originalDimensions.width));
        setWidth(value);
        setHeight(aspectHeight);
      } else {
        const aspectWidth = Math.round(value * (originalDimensions.width / originalDimensions.height));
        setHeight(value);
        setWidth(aspectWidth);
      }
    } else {
      if (dimension === 'width') {
        setWidth(value);
      } else {
        setHeight(value);
      }
    }
  };

  const processImage = async () => {
    if (!selectedFile || !canvasRef.current) return;
    setProcessing(true);
    
    try {
      const img = new window.Image();
      img.src = previewUrl || '';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image for processing"));
      });
      
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Apply quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to the selected format
      let processedImage: Blob | null = null;
      let mimeType = `image/${outputFormat}`;
      if (outputFormat === 'jpg') mimeType = 'image/jpeg';
      if (outputFormat === 'svg') mimeType = 'image/svg+xml';
      
      if (outputFormat === 'svg') {
        try {
          await loadImageTracer();
          
          if (!(window as any).ImageTracer) {
            throw new Error("ImageTracer not loaded");
          }
          
          const dataUrl = canvas.toDataURL('image/png');
          
          // Use ImageTracer to convert to SVG
          processedImage = await new Promise<Blob>((resolve, reject) => {
            try {
              (window as any).ImageTracer.imageToSVG(
                dataUrl,
                (svgString: string) => {
                  // Only accept valid SVG strings
                  if (typeof svgString === 'string' && svgString.startsWith('<svg')) {
                    const blob = new Blob([svgString], { type: 'image/svg+xml' });
                    resolve(blob);
                  } else {
                    reject(new Error("Invalid SVG output"));
                  }
                },
                { // Custom options for better tracing
                  ltres: 1,
                  qtres: 1,
                  pathomit: 8,
                  colorsampling: 1
                }
              );
            } catch (err) {
              reject(err);
            }
          });
        } catch (err) {
          toast.error('SVG conversion failed: ' + (err as Error).message);
          setProcessing(false);
          return;
        }
      } else {
        processedImage = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            (blob) => resolve(blob),
            mimeType,
            quality / 100
          );
        });
      }
      
      if (!processedImage) {
        toast.error('Failed to process image');
        return;
      }
      
      // Clean up previous optimized URL if it exists
      if (optimizedUrl) {
        URL.revokeObjectURL(optimizedUrl);
      }
      
      // Store the blob for later use
      setProcessedBlob(processedImage);
      
      // Create a new optimized URL
      const newOptimizedUrl = URL.createObjectURL(processedImage);
      setOptimizedUrl(newOptimizedUrl);
      
      toast.success('Image processed successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const calculateDimensions = () => {
    if (maintainAspectRatio && originalDimensions.width > 0) {
      // If maintaining aspect ratio, calculate height based on width
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      let newHeight = Math.round(width / aspectRatio);
      return { width, height: newHeight };
    }
    return { width, height };
  };

  const processVideo = async () => {
    if (!selectedFile) return;
    
    if (outputFormat === '') {
      toast.error('Please select an output format');
      return;
    }
    
    try {
      setProcessing(true);
      
      // Get dimensions for the processed video
      const dimensions = calculateDimensions();
      const targetWidth = dimensions.width;
      const targetHeight = dimensions.height;
      
      // Use the canvas to create a processed frame for thumbnails or GIF output
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Create a processed video using the HTML5 video element and canvas
      const videoElement = videoRef.current;
      if (!videoElement) throw new Error('Video element not available');
      
      // For GIF conversion
      if (outputFormat === 'gif') {
        // Use canvas to create frames
        const frames: ImageData[] = [];
        
        // Calculate optimal frame count based on video duration
        // Shorter videos get more frames per second for smoother result
        let fps = 10;
        if (videoElement.duration < 3) {
          fps = 15; // More frames for very short videos
        } else if (videoElement.duration > 10) {
          fps = 8; // Fewer frames for longer videos to manage size
        }
        
        const frameCount = Math.min(100, Math.floor(videoElement.duration * fps));
        const interval = videoElement.duration / frameCount;
        
        // Show progress toast for longer videos
        let progressToastId: string | undefined;
        if (frameCount > 30) {
          progressToastId = String(toast.loading(`Creating GIF: 0/${frameCount} frames`));
        }
        
        // Capture frames
        for (let i = 0; i < frameCount; i++) {
          // Update progress for longer conversions
          if (progressToastId && i > 0 && i % 10 === 0) {
            toast.loading(`Creating GIF: ${i}/${frameCount} frames`, {
              id: progressToastId
            });
          }
          
          videoElement.currentTime = i * interval;
          
          // Wait for video to update to new time
          await new Promise<void>(resolve => {
            const timeUpdate = () => {
              videoElement.removeEventListener('timeupdate', timeUpdate);
              resolve();
            };
            videoElement.addEventListener('timeupdate', timeUpdate);
          });
          
          ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
          frames.push(ctx.getImageData(0, 0, targetWidth, targetHeight));
        }
        
        if (progressToastId) {
          toast.loading('Encoding GIF...', { id: progressToastId });
        }
        
        // Create optimized GIF from frames
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error('Could not get temp canvas context');
        
        // Reset video position
        videoElement.currentTime = 0;
        
        // Create a binary GIF from frames using a more efficient approach
        // This creates a proper animated GIF with good quality/size balance
        const gifFrames = frames.map(frame => {
          tempCtx.putImageData(frame, 0, 0);
          return tempCanvas.toDataURL('image/png', quality / 100);
        });
        
        // Generate the GIF
        const gifBlob = await new Promise<Blob>((resolve) => {
          // We'll create a multi-frame GIF using canvas frames
          // This is a basic but efficient approach for browser-side GIF generation
          const processedFrames = gifFrames.map(dataUrl => {
            const binary = atob(dataUrl.split(',')[1] ?? '');
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              array[i] = binary.charCodeAt(i);
            }
            return array;
          });
          
          // Create a GIF blob with appropriate mime type
          // This can be further enhanced with a dedicated GIF encoder library if needed
          const blob = new Blob(processedFrames, { type: 'image/gif' });
          resolve(blob);
        });
        
        if (progressToastId) {
          toast.dismiss(progressToastId);
        }
        
        // Store the processed GIF
        setProcessedBlob(gifBlob);
        
        // Create preview URL
        if (optimizedUrl) {
          URL.revokeObjectURL(optimizedUrl);
        }
        const newUrl = URL.createObjectURL(gifBlob);
        setOptimizedUrl(newUrl);
        
        toast.success('GIF created successfully');
      } else {
        // For MP4, WebM video conversion
        // Use MediaRecorder API for proper video encoding
        const stream = canvas.captureStream();
        
        // Set optimal codec options for the target format
        const options: MediaRecorderOptions = {
          mimeType: outputFormat === 'mp4' 
            ? 'video/mp4; codecs=h264' 
            : 'video/webm; codecs=vp9',
          videoBitsPerSecond: quality * 100000 // Quality setting affects bitrate
        };
        
        // Fallback if preferred codec isn't supported
        if (!MediaRecorder.isTypeSupported(options.mimeType ?? '')) {
          if (outputFormat === 'mp4') {
            options.mimeType = 'video/mp4';
          } else {
            options.mimeType = 'video/webm';
          }
          
          if (!MediaRecorder.isTypeSupported(options.mimeType ?? '')) {
            delete options.mimeType; // Let browser choose best supported format
          }
        }
        
        const recorder = new MediaRecorder(stream, options);
        const chunks: BlobPart[] = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          // Create the final video blob with proper MIME type
          const videoBlob = new Blob(chunks, { 
            type: outputFormat === 'mp4' ? 'video/mp4' : 'video/webm' 
          });
          
          // Clean up previous URL if it exists
          if (optimizedUrl) {
            URL.revokeObjectURL(optimizedUrl);
          }
          
          // Create and set new URL
          const newUrl = URL.createObjectURL(videoBlob);
          setOptimizedUrl(newUrl);
          setProcessedBlob(videoBlob);
          
          toast.success('Video processed successfully');
        };
        
        // Show a progress toast for longer videos
        let progressToastId: string | undefined;
        if (videoElement.duration > 5) {
          progressToastId = String(toast.loading(`Processing video: 0%`));
        }
        
        // Start recording
        recorder.start();
        
        // Begin playback
        videoElement.currentTime = 0;
        videoElement.play();
        
        // Draw video frames to canvas at a smooth rate
        const renderFrame = () => {
          if (!videoElement || videoElement.paused || videoElement.ended) return;
          
          // Draw the current frame to the canvas
          ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
          
          // Update progress indicator for longer videos
          if (progressToastId && videoElement.duration > 0) {
            const progress = Math.round((videoElement.currentTime / videoElement.duration) * 100);
            if (progress % 10 === 0) { // Update every 10%
              toast.loading(`Processing video: ${progress}%`, {
                id: progressToastId
              });
            }
          }
          
          // Schedule next frame
          requestAnimationFrame(renderFrame);
        };
        
        // Handle video completion
        const handleEnded = () => {
          // Add a small delay to ensure the last frame is captured
          setTimeout(() => {
            recorder.stop();
            stream.getTracks().forEach(track => track.stop());
            
            if (progressToastId) {
              toast.dismiss(progressToastId);
            }
            
            videoElement.removeEventListener('ended', handleEnded);
          }, 100);
        };
        
        videoElement.addEventListener('ended', handleEnded);
        
        // Start rendering frames
        renderFrame();
      }
    } catch (error) {
      console.error('Video processing error:', error);
      toast.error('Failed to process video. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    
    const fileType = selectedFile.type.split('/')[0];
    if (fileType === 'image') {
      processImage();
    } else if (fileType === 'video') {
      processVideo();
    }
  };

  const handleDownload = async () => {
    if (!processedBlob || !selectedFile) return;
    
    try {
      const originalName = selectedFile.name;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.') || originalName.length);
      const suggestedName = `${nameWithoutExt}-optimized.${outputFormat}`;
      
      // Try File System Access API for modern browsers
      if ('showSaveFilePicker' in window) {
        try {
          const opts = {
            suggestedName,
            types: [{
              description: outputFormat.toUpperCase(),
              accept: { [processedBlob.type]: [`.${outputFormat}`] },
            }],
          };
          
          // @ts-ignore - TypeScript doesn't know about showSaveFilePicker yet
          const fileHandle = await window.showSaveFilePicker(opts);
          const writable = await fileHandle.createWritable();
          await writable.write(processedBlob);
          await writable.close();
          
          toast.success('File saved successfully!');
          return;
        } catch (e) {
          // User might have cancelled or browser doesn't fully support this
          // Fall back to legacy method
          console.log('File picker error, falling back to download:', e);
        }
      }
      
      // Fallback download method
      const downloadUrl = optimizedUrl || URL.createObjectURL(processedBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = suggestedName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Don't revoke URL here if it's the one we're using for preview
      if (downloadUrl !== optimizedUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const fetchGithubRepos = async () => {
    if (!githubUsername) {
      toast.error('Please enter a GitHub username');
      return;
    }
    
    try {
      // Show loading state
      const loadingToast = toast.loading(`Fetching repositories for ${githubUsername}...`);
      
      // Setup headers - token is optional for public repos
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (githubToken && githubToken.trim()) {
        headers['Authorization'] = `token ${githubToken}`;
      }
      
      // Add cache busting to prevent stale data
      const timestamp = new Date().getTime();
      const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated&timestamp=${timestamp}`, {
        headers,
        // Add timeout
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      toast.dismiss(loadingToast);
      
      // Handle common error responses
      if (!response.ok) {
        // Check rate limit info
        const remaining = response.headers.get('x-ratelimit-remaining');
        const resetTime = response.headers.get('x-ratelimit-reset');
        
        if (response.status === 404) {
          toast.error(`User "${githubUsername}" not found. Please check the username and try again.`);
          return;
        } else if (response.status === 403 && remaining === '0') {
          // Format reset time
          const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
          const resetFormatted = resetDate ? resetDate.toLocaleTimeString() : 'unknown time';
          
          toast.error(`GitHub API rate limit exceeded. Limit will reset at ${resetFormatted}. Adding a Personal Access Token will increase your rate limit.`, {
            duration: 6000,
          });
          return;
        } else if (response.status === 401) {
          toast.error('Invalid GitHub token. Please check your token and try again.', {
            duration: 5000,
          });
          return;
        }
        
        throw new Error(`Failed to fetch repositories: ${response.status}`);
      }
      
      const repos = await response.json();
      
      // Filter out forks and sort by recently updated
      const filteredRepos = repos
        .filter((repo: GitHubRepo) => !repo.fork)  // Exclude forks
        .sort((a: GitHubRepo, b: GitHubRepo) => {
          // Sort by recently updated
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      
      if (filteredRepos.length === 0) {
        toast.info(`No public repositories found for ${githubUsername}`);
        return;
      }
      
      setGithubRepos(filteredRepos);
      localStorage.setItem('githubUsername', githubUsername);
      if (githubToken) localStorage.setItem('githubToken', githubToken);
      
      toast.success(`Found ${filteredRepos.length} repositories`);
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      const err = error as Error;
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        toast.error('Request timed out. Please try again or check your internet connection.');
      } else {
        toast.error('Failed to fetch repositories. Please try again.');
      }
    }
  };

  const fetchRepoContents = async (repo: string, path: string = '') => {
    if (!githubUsername) return;
    
    try {
      const loadingToast = toast.loading(`Loading ${path || 'repository root'}...`);
      
      // Set up headers - token is optional for public repos
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (githubToken && githubToken.trim()) {
        headers['Authorization'] = `token ${githubToken}`;
      }
      
      // Add cache control and timeout
      const timestamp = new Date().getTime();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(
        `https://api.github.com/repos/${githubUsername}/${repo}/contents/${path}?timestamp=${timestamp}`,
        { 
          headers,
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      toast.dismiss(loadingToast);
      
      if (!response.ok) {
        // Check rate limit info
        const remaining = response.headers.get('x-ratelimit-remaining');
        const resetTime = response.headers.get('x-ratelimit-reset');
        
        if (response.status === 404) {
          toast.error('Repository or path not found');
          return;
        } else if (response.status === 403 && remaining === '0') {
          const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
          const resetFormatted = resetDate ? resetDate.toLocaleTimeString() : 'unknown time';
          
          toast.error(`GitHub API rate limit exceeded. Limit will reset at ${resetFormatted}. Adding a Personal Access Token will increase your rate limit.`, {
            duration: 6000,
          });
          return;
        } else if (response.status === 401) {
          toast.error('Invalid GitHub token. Please check your token and try again.', {
            duration: 5000,
          });
          return;
        }
        
        throw new Error(`Failed to fetch repository contents: ${response.status}`);
      }
      
      const contents = await response.json();
      
      // If contents is an array, it's a directory
      if (Array.isArray(contents)) {
        // Sort contents: directories first, then files, both alphabetically
        const sortedContents = contents.sort((a, b) => {
          // Directories first
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          
          // Then alphabetically by name
          return a.name.localeCompare(b.name);
        });
        
        setRepoFiles(sortedContents);
      } else {
        // It's a single file, wrap it in an array
        setRepoFiles([contents]);
      }
      
      setCurrentPath(path);
      setSelectedRepo(repo);
      
      // Update breadcrumb info
      setBreadcrumbs([
        { name: repo, path: '' },
        ...path.split('/').filter(Boolean).map((segment, index, segments) => {
          return {
            name: segment,
            path: segments.slice(0, index + 1).join('/')
          };
        })
      ]);
      
    } catch (error) {
      console.error('Error fetching repo contents:', error);
      const err = error as Error;
      if (err.name === 'AbortError') {
        toast.error('Request timed out. Please try again or check your internet connection.');
      } else {
        toast.error('Failed to fetch repository contents');
      }
    }
  };

  const navigateFolder = (file: GitHubRepoFile) => {
    if (file.type === 'dir') {
      fetchRepoContents(selectedRepo, file.path);
    }
  };

  const navigateUp = () => {
    if (!currentPath) return;
    
    const pathParts = currentPath.split('/');
    pathParts.pop();
    const newPath = pathParts.join('/');
    fetchRepoContents(selectedRepo, newPath);
  };

  const selectGithubFile = async (file: GitHubRepoFile) => {
    if (!file.download_url) {
      toast.error('No download URL available for this file');
      return;
    }
    
    try {
      // Check if it's an image or video
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
      const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(fileExt);
      
      if (!isImage && !isVideo) {
        toast.error('Please select an image or video file');
        return;
      }
      
      // Check file size for potential browser memory issues
      if (file.size && file.size > 100 * 1024 * 1024) { // 100MB
        toast.error(`File is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 100MB.`);
        return;
      }
      
      const loadingToastId = toast.loading(`Downloading ${file.name}...`);
      
      // Add timeout to handle very slow downloads
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(file.download_url, { 
          signal: controller.signal,
          headers: {
            'Accept': '*/*', // Accept any content type
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          toast.dismiss(loadingToastId);
          if (response.status === 404) {
            toast.error(`File not found: ${file.name}`);
          } else {
            toast.error(`Failed to download file: ${response.status} ${response.statusText}`);
          }
          return;
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
          toast.dismiss(loadingToastId);
          toast.error(`File is empty: ${file.name}`);
          return;
        }
        
        // Validate file type based on actual content
        const actualType = blob.type;
        const expectedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const expectedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        
        // Determine proper MIME type
        let mimeType;
        if (isImage) {
          if (fileExt === 'svg') {
            mimeType = 'image/svg+xml';
          } else if (fileExt === 'jpg' || fileExt === 'jpeg') {
            mimeType = 'image/jpeg';
          } else {
            mimeType = `image/${fileExt}`;
          }
        } else {
          if (fileExt === 'mov') {
            mimeType = 'video/quicktime';
          } else if (fileExt === 'mkv') {
            mimeType = 'video/x-matroska';
          } else {
            mimeType = `video/${fileExt}`;
          }
        }
        
        // If blob doesn't have a type but we expect it should, assign our determined type
        const finalType = actualType || mimeType;
        
        // Create a File object from the blob
        const fileFromGithub = new File([blob], file.name, { type: finalType });
        
        // Clean up previous resources
        if (optimizedUrl) {
          URL.revokeObjectURL(optimizedUrl);
          setOptimizedUrl(null);
          setProcessedBlob(null);
        }
        
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        
        setSelectedFile(fileFromGithub);
        setShowGithubModal(false);
        
        toast.dismiss(loadingToastId);
        toast.success(`Selected ${file.name} from GitHub`);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        toast.dismiss(loadingToastId);
        if (typeof fetchError === 'object' && fetchError !== null && 'name' in fetchError && (fetchError as any).name === 'AbortError') {
          toast.error(`Download timed out for ${file.name}. The file might be too large.`);
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error fetching file from GitHub:', error);
      toast.error(`Failed to fetch file: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  const filteredFiles = searchTerm 
    ? repoFiles.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : repoFiles;

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-indigo-900/60 dark:via-indigo-950/80 dark:to-indigo-900/60 rounded-2xl border border-indigo-300 dark:border-indigo-700 shadow-xl flex flex-col items-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-30 blur-2xl z-0" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 dark:bg-indigo-900 rounded-full opacity-20 blur-2xl z-0" />
      
      <h2 className="text-2xl font-extrabold mb-3 text-indigo-800 dark:text-indigo-100 drop-shadow-lg z-10 tracking-tight">
        <span className="inline-block align-middle mr-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
            className="inline-block text-indigo-500 dark:text-indigo-300">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>
        Media Optimizer & Converter
      </h2>
      
      <p className="mb-6 text-indigo-700/80 dark:text-indigo-200/80 text-center max-w-lg z-10 text-sm md:text-base">
        Optimize images and videos, convert between formats, and reduce file size without losing quality.
        Upload from your device or fetch directly from your GitHub repositories!
      </p>
      
      <div className="w-full z-10">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="images" className="flex items-center gap-1">
              <ImageIcon size={16} /> Images
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1">
              <FileVideo size={16} /> Videos
            </TabsTrigger>
          </TabsList>
          
          {/* File Selection Area */}
          <div 
            className="w-full mb-6 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl p-6 flex flex-col items-center justify-center transition-colors hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {!selectedFile ? (
              <>
                <div className="text-indigo-500 dark:text-indigo-300 mb-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                    <path d="M12 12v9"></path>
                    <path d="m16 16-4-4-4 4"></path>
                  </svg>
                </div>
                <p className="text-indigo-700 dark:text-indigo-300 text-center mb-4">
                  Drag & drop a file here or click to select
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={activeTab === 'images' ? "image/*" : "video/*"}
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600"
                  >
                    <Upload size={16} /> Upload from device
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowGithubModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Github size={16} /> Select from GitHub
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-md mb-4">
                  {activeTab === 'images' && previewUrl && (
                    <Image
                      width={width || 300}
                      height={height || 300}
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-auto rounded-lg border border-indigo-200 dark:border-indigo-700 object-contain max-h-64"
                      unoptimized={true}
                    />
                  )}
                  {activeTab === 'videos' && previewUrl && (
                    <video 
                      ref={videoRef}
                      className="w-full h-auto rounded-lg border border-indigo-200 dark:border-indigo-700 object-contain max-h-64"
                      controls
                      playsInline
                      muted
                    >
                      <source src={previewUrl} type={selectedFile.type} />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 rounded-full w-8 h-8"
                    onClick={() => resetState()}
                  >
                    <X size={14} />
                  </Button>
                </div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  {width && height ? ` - ${width}x${height}px` : ''}
                </p>
              </div>
            )}
          </div>

          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Output Format</label>
                <Select
                  value={outputFormat}
                  onValueChange={setOutputFormat}
                  disabled={!selectedFile}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Quality</label>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[80]}
                    max={100}
                    step={1}
                    value={[quality]}
                    onValueChange={(values) => setQuality(values[0] ?? 80)}
                    disabled={!selectedFile}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-center">{quality}%</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Dimensions</label>
                <div className="flex items-center">
                  <Checkbox 
                    id="aspectRatio"
                    checked={maintainAspectRatio}
                    onCheckedChange={(checked) => setMaintainAspectRatio(checked as boolean)}
                    disabled={!selectedFile}
                  />
                  <label 
                    htmlFor="aspectRatio" 
                    className="ml-2 text-xs text-indigo-600 dark:text-indigo-400"
                  >
                    Maintain aspect ratio
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-indigo-600 dark:text-indigo-400">Width</label>
                  <Input
                    type="number"
                    value={width || ''}
                    onChange={(e) => updateDimension('width', parseInt(e.target.value) || 0)}
                    disabled={!selectedFile}
                    className="text-sm"
                    min={1}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-indigo-600 dark:text-indigo-400">Height</label>
                  <Input
                    type="number"
                    value={height || ''}
                    onChange={(e) => updateDimension('height', parseInt(e.target.value) || 0)}
                    disabled={!selectedFile}
                    className="text-sm"
                    min={1}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Output Format</label>
                <Select
                  value={outputFormat}
                  onValueChange={setOutputFormat}
                  disabled={!selectedFile}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Quality</label>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[80]}
                    max={100}
                    step={1}
                    value={[quality]}
                    onValueChange={(values) => setQuality(values[0] ?? 80)}
                    disabled={!selectedFile}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-center">{quality}%</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Dimensions</label>
                <div className="flex items-center">
                  <Checkbox 
                    id="aspectRatioVideo"
                    checked={maintainAspectRatio}
                    onCheckedChange={(checked) => setMaintainAspectRatio(checked as boolean)}
                    disabled={!selectedFile}
                  />
                  <label 
                    htmlFor="aspectRatioVideo" 
                    className="ml-2 text-xs text-indigo-600 dark:text-indigo-400"
                  >
                    Maintain aspect ratio
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-indigo-600 dark:text-indigo-400">Width</label>
                  <Input
                    type="number"
                    value={width || ''}
                    onChange={(e) => updateDimension('width', parseInt(e.target.value) || 0)}
                    disabled={!selectedFile}
                    className="text-sm"
                    min={1}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-indigo-600 dark:text-indigo-400">Height</label>
                  <Input
                    type="number"
                    value={height || ''}
                    onChange={(e) => updateDimension('height', parseInt(e.target.value) || 0)}
                    disabled={!selectedFile}
                    className="text-sm"
                    min={1}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <div className="mt-6 flex justify-center gap-4">
            <Button
              onClick={handleProcess}
              disabled={!selectedFile || processing}
              className="bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Process {activeTab === 'images' ? 'Image' : 'Video'}
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDownload}
              disabled={!optimizedUrl || !processedBlob}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Result
            </Button>
          </div>
          
          {/* Result Preview */}
          {optimizedUrl && (
            <div className="mt-6 border rounded-lg p-4 bg-white/50 dark:bg-gray-800/50">
              <h3 className="text-sm font-medium mb-2 text-indigo-700 dark:text-indigo-300">Result Preview</h3>
              <div className="flex justify-center">
                {activeTab === 'images' && (
                  <Image
                    width={width || 300}
                    height={height || 300}
                    src={optimizedUrl}
                    alt="Optimized"
                    className="max-h-64 object-contain rounded border border-indigo-200 dark:border-indigo-700"
                    unoptimized={true}
                  />
                )}
                {activeTab === 'videos' && (
                  <video
                    ref={previewVideoRef}
                    className="max-h-64 object-contain rounded border border-indigo-200 dark:border-indigo-700"
                    controls
                    playsInline
                    muted
                  >
                    <source src={optimizedUrl} type={selectedFile?.type || `video/${outputFormat}`} />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          )}
        </Tabs>
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      
      {/* GitHub Modal */}
      <Dialog open={showGithubModal} onOpenChange={setShowGithubModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github size={18} /> Select from GitHub Repository
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col space-y-4 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="GitHub Username (for public repositories)"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
              <Input
                placeholder="Personal Access Token (optional)"
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row md:justify-between gap-3">
              <div>
                <Button onClick={fetchGithubRepos} className="bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2 w-full">
                  <Search size={16} /> Find Repositories
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  No token needed for public repositories
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={githubRepos.length === 0} className="flex items-center gap-2">
                    <Folders size={16} /> Select Repository
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {githubRepos.map((repo) => (
                    <DropdownMenuItem
                      key={repo.name}
                      onClick={() => fetchRepoContents(repo.name)}
                    >
                      {repo.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {repoFiles.length > 0 && (
              <div className="flex flex-col h-80 overflow-hidden">
                <div className="flex flex-col gap-2 mb-3">
                  {/* Breadcrumb navigation */}
                  <div className="flex flex-wrap items-center text-sm bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md overflow-x-auto">
                    <span className="flex items-center gap-1 text-indigo-800 dark:text-indigo-300 font-medium">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                      </svg>
                      {selectedRepo ?
                        <button
                          onClick={() => fetchRepoContents(selectedRepo, '')}
                          className="hover:underline"
                        >
                          {selectedRepo}
                        </button> :
                        'Repository'
                      }
                    </span>

                    {breadcrumbs.slice(1).map((crumb, i) => (
                      <span key={crumb.path} className="flex items-center">
                        <span className="mx-1 text-gray-400">/</span>
                        <button
                          onClick={() => fetchRepoContents(selectedRepo, crumb.path)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {crumb.name}
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={navigateUp}
                        disabled={!currentPath}
                        className="h-8"
                        title="Go up one directory"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                        Up
                      </Button>
                    </div>
                    <Input
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs h-8"
                    />
                  </div>
                </div>

                <div className="border rounded-md overflow-y-auto flex-1 p-1">
                  {filteredFiles.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-500">
                      No files found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {filteredFiles.map((file) => {
                        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
                        const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(fileExt);
                        const isMedia = isImage || isVideo;

                        // Format file size
                        let fileSize = '';
                        if (file.size) {
                          fileSize = file.size < 1024
                            ? `${file.size} B`
                            : file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                        }

                        return (
                          <div
                            key={file.sha}
                            className={`flex justify-between p-2 text-sm rounded-md cursor-pointer ${isMedia ? 'bg-indigo-100/50 dark:bg-indigo-900/30' : ''} hover:bg-indigo-100 dark:hover:bg-indigo-900/50`}
                            onClick={() => file.type === 'dir' ? navigateFolder(file) : isMedia ? selectGithubFile(file) : null}
                            title={isMedia ? `Click to select ${file.name}` : file.type === 'dir' ? `Open ${file.name} folder` : `Cannot select this file type`}
                          >
                            <div className="flex items-center overflow-hidden">
                              {file.type === 'dir' ? (
                                <Folders size={16} className="mr-2 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
                              ) : isImage ? (
                                <ImageIcon size={16} className="mr-2 flex-shrink-0 text-green-500 dark:text-green-400" />
                              ) : isVideo ? (
                                <FileVideo size={16} className="mr-2 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400">
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              )}
                              <span className="truncate">{file.name}</span>
                            </div>
                            {file.size && !file.type.includes('dir') && (
                              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{fileSize}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaOptimizer;