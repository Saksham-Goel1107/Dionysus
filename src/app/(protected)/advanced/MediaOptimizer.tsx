'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Dialog as EditorDialog,
  DialogContent as EditorDialogContent,
  DialogHeader as EditorDialogHeader,
  DialogTitle as EditorDialogTitle,
  DialogFooter as EditorDialogFooter,
  DialogDescription as EditorDialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Download,
  FileVideo,
  Folders,
  Github,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  { label: 'AVIF', value: 'avif' },
];

const VIDEO_FORMATS = [
  { label: 'MP4', value: 'mp4' },
  { label: 'WebM', value: 'webm' },
  { label: 'GIF', value: 'gif' },
];

// Dynamically load imagetracerjs if needed
const loadImageTracer = async () => {
  if (typeof window !== 'undefined' && !(window as any).ImageTracer) {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/imagetracer.min.js';
      script.async = true;
      script.onload = () => {
        // Give a brief delay for the script to initialize
        setTimeout(() => {
          if (!(window as any).ImageTracer) {
            console.error('ImageTracer loaded but not available as window.ImageTracer');
            reject(new Error('ImageTracer not found after loading'));
          } else {
            console.log('ImageTracer loaded successfully');
            resolve();
          }
        }, 100);
      };
      script.onerror = (error) => {
        console.error('Failed to load ImageTracer:', error);
        reject(new Error('Failed to load ImageTracer'));
      };
      document.body.appendChild(script);
    });
  }

  return Promise.resolve();
};

// Pre-load GIF.js for better GIF conversion
const loadGifJs = async () => {
  if (typeof window !== 'undefined' && !(window as any).GIF) {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/gif.js/dist/gif.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load GIF.js'));
      document.body.appendChild(script);
    });
  }
  return Promise.resolve();
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
  const [showAdvancedEditorModal, setShowAdvancedEditorModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Pre-load ImageTracer and GIF.js for SVG and GIF conversion
  useEffect(() => {
    // Load both libraries in parallel
    Promise.all([
      loadImageTracer().catch((err) => console.warn('ImageTracer preload warning:', err)),
      loadGifJs().catch((err) => console.warn('GIF.js preload warning:', err)),
    ]).catch(console.error);
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
        toast.error('Video failed to load');
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
    // Don't allow negative values
    if (value < 0) value = 0;

    if (maintainAspectRatio && originalDimensions.width && originalDimensions.height) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;

      if (dimension === 'width') {
        setWidth(value);
        // Calculate new height based on aspect ratio
        const newHeight = Math.round(value / aspectRatio);
        setHeight(newHeight);
      } else {
        setHeight(value);
        // Calculate new width based on aspect ratio
        const newWidth = Math.round(value * aspectRatio);
        setWidth(newWidth);
      }
    } else {
      // Just update the one dimension
      if (dimension === 'width') {
        setWidth(value);
      } else {
        setHeight(value);
      }
    }
  };

  const resetDimensions = () => {
    // Reset to original dimensions
    setWidth(originalDimensions.width);
    setHeight(originalDimensions.height);
  };

  const processImage = async () => {
    if (!selectedFile || !canvasRef.current) return;
    setProcessing(true);

    try {
      const img = new window.Image();
      img.src = previewUrl || '';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for processing'));
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
          await loadImageTracer(); // Make sure ImageTracer is loaded

          // Check if ImageTracer is properly loaded
          if (!(window as any).ImageTracer) {
            throw new Error('ImageTracer not available');
          }

          // Check if the imageToSVG method exists
          if (typeof (window as any).ImageTracer.imageToSVG !== 'function') {
            throw new Error('ImageTracer.imageToSVG is not available');
          }

          // Convert to PNG first to ensure compatibility
          const pngBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
          });

          if (!pngBlob) {
            throw new Error('Failed to create PNG from canvas');
          }

          // Convert the PNG blob to an Image object
          const tempImage = new window.Image();
          const tempUrl = URL.createObjectURL(pngBlob);

          const svgString = await new Promise<string>((resolve, reject) => {
            tempImage.onload = () => {
              try {
                // Prepare a temporary canvas with the image
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = tempImage.width;
                tempCanvas.height = tempImage.height;
                const tempCtx = tempCanvas.getContext('2d');

                if (!tempCtx) {
                  reject(new Error('Could not get temporary canvas context'));
                  return;
                }

                // Draw the image to the temporary canvas
                tempCtx.drawImage(tempImage, 0, 0);

                // Get the image data
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

                // Use ImageTracer's imageToSVG function
                const ImageTracer = (window as any).ImageTracer;
                const svgResult = ImageTracer.imageDataToSVG(imageData, {
                  ltres: 1,
                  qtres: 1,
                  pathomit: 8,
                  colorsampling: 1,
                });

                if (!svgResult) {
                  reject(new Error('SVG conversion returned empty result'));
                  return;
                }

                resolve(svgResult);
              } catch (error) {
                reject(error);
              } finally {
                // Clean up
                URL.revokeObjectURL(tempUrl);
              }
            };
            tempImage.onerror = () => {
              URL.revokeObjectURL(tempUrl);
              reject(new Error('Failed to load image for SVG conversion'));
            };
            tempImage.src = tempUrl;
          });

          // Create a blob from the SVG string
          processedImage = new Blob([svgString], { type: 'image/svg+xml' });
        } catch (err) {
          console.error('SVG conversion error:', err);
          toast.error('SVG conversion failed: ' + (err as Error).message);

          // Fallback to PNG if SVG conversion fails
          toast.info('Falling back to PNG format');
          processedImage = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png', quality / 100);
          });

          if (!processedImage) {
            throw new Error('Failed to process image with fallback to PNG');
          }
        }
      } else {
        processedImage = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), mimeType, quality / 100);
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

      // Pause any playing video first
      if (videoRef.current) {
        videoRef.current.pause();
      }

      // Get dimensions for the processed video
      // Validate dimensions to ensure they're reasonable
      if (width <= 0 || height <= 0) {
        // Use original dimensions if invalid values were provided
        setWidth(originalDimensions.width);
        setHeight(originalDimensions.height);
      }

      // Calculate dimensions ensuring aspect ratio if needed
      const dimensions = calculateDimensions();
      const targetWidth = dimensions.width || originalDimensions.width;
      const targetHeight = dimensions.height || originalDimensions.height;

      // Apply minimum dimensions to prevent issues
      const finalWidth = Math.max(targetWidth, 32);
      const finalHeight = Math.max(targetHeight, 32);

      // Use the canvas to create a processed frame
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Create a processed video using the HTML5 video element and canvas
      const videoElement = videoRef.current;
      if (!videoElement) throw new Error('Video element not available');

      // For GIF conversion
      if (outputFormat === 'gif') {
        // Load GIF.js and worker
        const loadGifJs = async () => {
          if (typeof window !== 'undefined' && !(window as any).GIF) {
            return new Promise<void>((resolve, reject) => {
              // First load the main gif.js script
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/gif.js/dist/gif.js';
              script.async = true;

              script.onload = () => {
                console.log('GIF.js loaded successfully');
                // Check if GIF constructor is available
                if (typeof (window as any).GIF === 'function') {
                  resolve();
                } else {
                  console.error('GIF.js loaded but GIF constructor is not available');
                  reject(new Error('GIF.js loaded incorrectly'));
                }
              };

              script.onerror = () => {
                console.error('Failed to load GIF.js');
                reject(new Error('Failed to load GIF.js'));
              };

              document.body.appendChild(script);
            });
          }
          return Promise.resolve();
        };

        try {
          // First try to load GIF.js library
          await loadGifJs();

          if (typeof (window as any).GIF !== 'function') {
            throw new Error('GIF.js library not loaded properly');
          }

          // Capture frames
          const frames: HTMLCanvasElement[] = [];
          const frameCount = Math.min(100, Math.floor(videoElement.duration * 10));
          const interval = videoElement.duration / frameCount;

          // Show progress toast for longer videos
          let progressToastId: string | undefined;
          if (frameCount > 30) {
            progressToastId = String(toast.loading(`Creating GIF: 0/${frameCount} frames`));
          }

          // Setup temporary canvas for capturing frames
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = finalWidth;
          tempCanvas.height = finalHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) throw new Error('Could not get temporary canvas context');

          // Reset video position
          videoElement.currentTime = 0;

          // Capture frames
          for (let i = 0; i < frameCount; i++) {
            // Update progress for longer conversions
            if (progressToastId && i > 0 && i % 10 === 0) {
              toast.loading(`Creating GIF: ${i}/${frameCount} frames`, {
                id: progressToastId,
              });
            }

            videoElement.currentTime = i * interval;

            // Wait for video to update to new time
            await new Promise<void>((resolve) => {
              const timeUpdate = () => {
                videoElement.removeEventListener('timeupdate', timeUpdate);
                resolve();
              };
              videoElement.addEventListener('timeupdate', timeUpdate);
            });

            // Draw frame to canvas
            ctx.drawImage(videoElement, 0, 0, finalWidth, finalHeight);

            // Clone the canvas for this frame
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = finalWidth;
            frameCanvas.height = finalHeight;
            const frameCtx = frameCanvas.getContext('2d');
            if (frameCtx) {
              frameCtx.drawImage(canvas, 0, 0);
              frames.push(frameCanvas);
            }
          }

          if (progressToastId) {
            toast.loading('Encoding GIF...', { id: progressToastId });
          }

          // Create GIF using GIF.js
          const gif = new (window as any).GIF({
            workers: 2,
            quality: Math.max(1, Math.min(30, 31 - Math.floor(quality / 3.3))), // Convert quality (0-100) to GIF quality (30-1)
            width: finalWidth,
            height: finalHeight,
            workerScript: '/gif.worker.js',
            dither: true, // Enable dithering for better quality
          });

          // Add frames to GIF
          frames.forEach((frame) => {
            gif.addFrame(frame, { delay: 100, copy: true });
          });

          // Render GIF
          const gifBlob = await new Promise<Blob>((resolve, reject) => {
            gif.on('finished', (blob: Blob) => {
              resolve(blob);
            });

            gif.on('progress', (progress: number) => {
              if (progressToastId && progress > 0) {
                toast.loading(`Encoding GIF: ${Math.round(progress * 100)}%`, {
                  id: progressToastId,
                });
              }
            });

            gif.on('error', reject);
            gif.render();
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
        } catch (error) {
          console.error('GIF creation error:', error);
          toast.error('Failed to create GIF: ' + (error as Error).message);

          // Fallback to a still image if GIF creation fails
          try {
            toast.info('Falling back to creating a still image');
            ctx.drawImage(videoElement, 0, 0, finalWidth, finalHeight);
            const stillImage = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((blob) => resolve(blob), 'image/png', quality / 100);
            });

            if (stillImage) {
              setProcessedBlob(stillImage);
              if (optimizedUrl) URL.revokeObjectURL(optimizedUrl);
              setOptimizedUrl(URL.createObjectURL(stillImage));
            }
          } catch (fallbackError) {
            console.error('Fallback image creation failed:', fallbackError);
          }
        }
      } else {
        // For MP4, WebM video conversion
        // Use MediaRecorder API for proper video encoding
        const stream = canvas.captureStream();

        // Set optimal codec options for the target format
        const options: MediaRecorderOptions = {
          mimeType: outputFormat === 'mp4' ? 'video/mp4; codecs=h264' : 'video/webm; codecs=vp9',
          videoBitsPerSecond: quality * 200000, // Higher bitrate for better quality
          audioBitsPerSecond: 128000, // Include audio with decent bitrate // Quality setting affects bitrate
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
          // Create the final video blob with proper MIME type and audio
          const videoBlob = new Blob(chunks, {
            type: outputFormat === 'mp4' ? 'video/mp4' : 'video/webm',
          });

          // Validate the processed video
          if (videoBlob.size < 100) {
            throw new Error('Video processing failed - output file is too small');
          }

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

        // Set to beginning but don't auto-play
        videoElement.currentTime = 0;
        // Use a muted version for processing to avoid audio playback during processing
        videoElement.muted = true;

        // Draw video frames to canvas at a smooth rate
        const renderFrame = () => {
          if (!videoElement || videoElement.paused || videoElement.ended) return;

          // Draw the current frame to the canvas
          ctx.drawImage(videoElement, 0, 0, finalWidth, finalHeight);

          // Update progress indicator for longer videos
          if (progressToastId && videoElement.duration > 0) {
            const progress = Math.round((videoElement.currentTime / videoElement.duration) * 100);
            if (progress % 10 === 0) {
              // Update every 10%
              toast.loading(`Processing video: ${progress}%`, {
                id: progressToastId,
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
            stream.getTracks().forEach((track) => track.stop());

            if (progressToastId) {
              toast.dismiss(progressToastId);
            }

            videoElement.removeEventListener('ended', handleEnded);
          }, 100);
        };

        videoElement.addEventListener('ended', handleEnded);

        // Start playback and rendering frames
        videoElement.play().catch((err) => {
          console.error('Error playing video for processing:', err);
          toast.error('Failed to process video');
          setProcessing(false);
        });
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
      const nameWithoutExt = originalName.substring(
        0,
        originalName.lastIndexOf('.') || originalName.length,
      );
      const suggestedName = `${nameWithoutExt}-optimized.${outputFormat}`;

      // Try File System Access API for modern browsers
      if ('showSaveFilePicker' in window) {
        try {
          const opts = {
            suggestedName,
            types: [
              {
                description: outputFormat.toUpperCase(),
                accept: { [processedBlob.type]: [`.${outputFormat}`] },
              },
            ],
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
        Accept: 'application/vnd.github.v3+json',
      };

      if (githubToken && githubToken.trim()) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      // Add cache busting to prevent stale data
      const timestamp = new Date().getTime();
      const response = await fetch(
        `https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated&timestamp=${timestamp}`,
        {
          headers,
          // Add timeout
          signal: AbortSignal.timeout(15000), // 15 second timeout
        },
      );

      toast.dismiss(loadingToast);

      // Handle common error responses
      if (!response.ok) {
        // Check rate limit info
        const remaining = response.headers.get('x-ratelimit-remaining');
        const resetTime = response.headers.get('x-ratelimit-reset');

        if (response.status === 404) {
          toast.error(
            `User "${githubUsername}" not found. Please check the username and try again.`,
          );
          return;
        } else if (response.status === 403 && remaining === '0') {
          // Format reset time
          const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
          const resetFormatted = resetDate ? resetDate.toLocaleTimeString() : 'unknown time';

          toast.error(
            `GitHub API rate limit exceeded. Limit will reset at ${resetFormatted}. Adding a Personal Access Token will increase your rate limit.`,
            {
              duration: 6000,
            },
          );
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
        .filter((repo: GitHubRepo) => !repo.fork) // Exclude forks
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
        Accept: 'application/vnd.github.v3+json',
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
          signal: controller.signal,
        },
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

          toast.error(
            `GitHub API rate limit exceeded. Limit will reset at ${resetFormatted}. Adding a Personal Access Token will increase your rate limit.`,
            {
              duration: 6000,
            },
          );
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
        ...path
          .split('/')
          .filter(Boolean)
          .map((segment, index, segments) => {
            return {
              name: segment,
              path: segments.slice(0, index + 1).join('/'),
            };
          }),
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
      if (file.size && file.size > 100 * 1024 * 1024) {
        // 100MB
        toast.error(
          `File is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 100MB.`,
        );
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
            Accept: '*/*', // Accept any content type
          },
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
        if (
          typeof fetchError === 'object' &&
          fetchError !== null &&
          'name' in fetchError &&
          (fetchError as any).name === 'AbortError'
        ) {
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
    ? repoFiles.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : repoFiles;

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-8 shadow-xl dark:border-indigo-700 dark:from-indigo-900/60 dark:via-indigo-950/80 dark:to-indigo-900/60">
      <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-indigo-200 opacity-30 blur-2xl dark:bg-indigo-800" />
      <div className="absolute -bottom-10 -left-10 z-0 h-32 w-32 rounded-full bg-indigo-100 opacity-20 blur-2xl dark:bg-indigo-900" />

      <h2 className="z-10 mb-3 text-2xl font-extrabold tracking-tight text-indigo-800 drop-shadow-lg dark:text-indigo-100">
        <span className="mr-2 inline-block align-middle">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="inline-block text-indigo-500 dark:text-indigo-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </span>
        Media Optimizer & Converter
      </h2>

      <p className="z-10 mb-6 max-w-lg text-center text-sm text-indigo-700/80 dark:text-indigo-200/80 md:text-base">
        Optimize images and videos, convert between formats, and reduce file size without losing
        quality. Upload from your device or fetch directly from your GitHub repositories!
      </p>

      <div className="z-10 w-full">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="images" className="flex items-center gap-1">
              <ImageIcon size={16} /> Images
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1">
              <FileVideo size={16} /> Videos
            </TabsTrigger>
          </TabsList>

          {/* File Selection Area */}
          <div
            className="mb-6 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-300 p-6 transition-colors hover:bg-indigo-100/50 dark:border-indigo-700 dark:hover:bg-indigo-900/30"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {!selectedFile ? (
              <>
                <div className="mb-4 text-indigo-500 dark:text-indigo-300">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                    <path d="M12 12v9"></path>
                    <path d="m16 16-4-4-4 4"></path>
                  </svg>
                </div>
                <p className="mb-4 text-center text-indigo-700 dark:text-indigo-300">
                  Drag & drop a file here or click to select
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={activeTab === 'images' ? 'image/*' : 'video/*'}
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
              <div className="flex w-full flex-col items-center">
                <div className="relative mb-4 w-full max-w-md">
                  {activeTab === 'images' && previewUrl && (
                    <Image
                      width={width || 300}
                      height={height || 300}
                      src={previewUrl}
                      alt="Preview"
                      className="h-auto max-h-64 w-full rounded-lg border border-indigo-200 object-contain dark:border-indigo-700"
                      unoptimized={true}
                    />
                  )}
                  {activeTab === 'videos' && previewUrl && (
                    <video
                      ref={videoRef}
                      className="h-auto max-h-64 w-full rounded-lg border border-indigo-200 object-contain dark:border-indigo-700"
                      controls
                      playsInline
                      muted={false} // Enable sound
                    >
                      <source src={previewUrl} type={selectedFile.type} />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
                    onClick={() => resetState()}
                  >
                    <X size={14} />
                  </Button>
                </div>
                <p className="mb-2 text-sm text-indigo-700 dark:text-indigo-300">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  {width && height ? ` - ${width}x${height}px` : ''}
                </p>
              </div>
            )}
          </div>

          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Output Format
                </label>
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
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Quality
                </label>
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
                  <span className="w-12 text-center text-sm">{quality}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Dimensions
                </label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="aspectRatio"
                    checked={maintainAspectRatio}
                    onCheckedChange={(checked) => setMaintainAspectRatio(checked as boolean)}
                    disabled={!selectedFile}
                  />
                  <label
                    htmlFor="aspectRatio"
                    className="mr-2 text-xs text-indigo-600 dark:text-indigo-400"
                  >
                    Maintain aspect ratio
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetDimensions}
                    disabled={!selectedFile}
                    className="h-6 text-xs"
                  >
                    Reset
                  </Button>
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
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Output Format
                </label>
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
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Quality
                </label>
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
                  <span className="w-12 text-center text-sm">{quality}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Dimensions
                </label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="aspectRatioVideo"
                    checked={maintainAspectRatio}
                    onCheckedChange={(checked) => setMaintainAspectRatio(checked as boolean)}
                    disabled={!selectedFile}
                  />
                  <label
                    htmlFor="aspectRatioVideo"
                    className="mr-2 text-xs text-indigo-600 dark:text-indigo-400"
                  >
                    Maintain aspect ratio
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetDimensions}
                    disabled={!selectedFile}
                    className="h-6 text-xs"
                  >
                    Reset
                  </Button>
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
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600"
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

          {/* Advanced Editor Button */}
          {activeTab === 'images' && selectedFile && (
            <div className="mt-6 border-t border-indigo-200 pt-4 text-center dark:border-indigo-700/50">
              <p className="mb-3 text-sm text-indigo-700/80 dark:text-indigo-300/80">
                Need more advanced editing capabilities?
              </p>
              <Button
                onClick={() => setShowAdvancedEditorModal(true)}
                variant="outline"
                className="border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Open in Advanced Editor
              </Button>
            </div>
          )}

          {/* Result Preview */}
          {optimizedUrl && (
            <div className="mt-6 rounded-lg border bg-white/50 p-4 dark:bg-gray-800/50">
              <h3 className="mb-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Result Preview
              </h3>
              <div className="flex justify-center">
                {activeTab === 'images' && (
                  <Image
                    width={width || 300}
                    height={height || 300}
                    src={optimizedUrl}
                    alt="Optimized"
                    className="max-h-64 rounded border border-indigo-200 object-contain dark:border-indigo-700"
                    unoptimized={true}
                  />
                )}
                {activeTab === 'videos' && (
                  <video
                    ref={previewVideoRef}
                    className="max-h-64 rounded border border-indigo-200 object-contain dark:border-indigo-700"
                    controls
                    playsInline
                    muted={false} // Enable sound
                  >
                    <source
                      src={optimizedUrl}
                      type={selectedFile?.type || `video/${outputFormat}`}
                    />
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
        <DialogContent
          className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github size={18} /> Select from GitHub Repository
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col space-y-4 overflow-hidden">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="flex flex-col gap-3 md:flex-row md:justify-between">
              <div>
                <Button
                  onClick={fetchGithubRepos}
                  className="flex w-full items-center gap-2 bg-indigo-500 hover:bg-indigo-600"
                >
                  <Search size={16} /> Find Repositories
                </Button>
                <p className="mt-1 text-xs text-gray-500">
                  No token needed for public repositories
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={githubRepos.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Folders size={16} /> Select Repository
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {githubRepos.map((repo) => (
                    <DropdownMenuItem key={repo.name} onClick={() => fetchRepoContents(repo.name)}>
                      {repo.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {repoFiles.length > 0 && (
              <div className="flex h-80 flex-col overflow-hidden">
                <div className="mb-3 flex flex-col gap-2">
                  {/* Breadcrumb navigation */}
                  <div className="flex flex-wrap items-center overflow-x-auto rounded-md bg-indigo-50 p-2 text-sm dark:bg-indigo-900/30">
                    <span className="flex items-center gap-1 font-medium text-indigo-800 dark:text-indigo-300">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                      </svg>
                      {selectedRepo ? (
                        <button
                          onClick={() => fetchRepoContents(selectedRepo, '')}
                          className="hover:underline"
                        >
                          {selectedRepo}
                        </button>
                      ) : (
                        'Repository'
                      )}
                    </span>

                    {breadcrumbs.slice(1).map((crumb) => (
                      <span key={crumb.path} className="flex items-center">
                        <span className="mx-1 text-gray-400">/</span>
                        <button
                          onClick={() => fetchRepoContents(selectedRepo, crumb.path)}
                          className="text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {crumb.name}
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={navigateUp}
                        disabled={!currentPath}
                        className="h-8"
                        title="Go up one directory"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                        Up
                      </Button>
                    </div>
                    <Input
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 max-w-xs"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto rounded-md border p-1">
                  {filteredFiles.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      No files found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                      {filteredFiles.map((file) => {
                        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                          fileExt,
                        );
                        const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(fileExt);
                        const isMedia = isImage || isVideo;

                        // Format file size
                        let fileSize = '';
                        if (file.size) {
                          fileSize =
                            file.size < 1024
                              ? `${file.size} B`
                              : file.size < 1024 * 1024
                                ? `${(file.size / 1024).toFixed(1)} KB`
                                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                        }

                        return (
                          <div
                            key={file.sha}
                            className={`flex cursor-pointer justify-between rounded-md p-2 text-sm ${isMedia ? 'bg-indigo-100/50 dark:bg-indigo-900/30' : ''} hover:bg-indigo-100 dark:hover:bg-indigo-900/50`}
                            onClick={() =>
                              file.type === 'dir'
                                ? navigateFolder(file)
                                : isMedia
                                  ? selectGithubFile(file)
                                  : null
                            }
                            title={
                              isMedia
                                ? `Click to select ${file.name}`
                                : file.type === 'dir'
                                  ? `Open ${file.name} folder`
                                  : `Cannot select this file type`
                            }
                          >
                            <div className="flex items-center overflow-hidden">
                              {file.type === 'dir' ? (
                                <Folders
                                  size={16}
                                  className="mr-2 flex-shrink-0 text-indigo-500 dark:text-indigo-400"
                                />
                              ) : isImage ? (
                                <ImageIcon
                                  size={16}
                                  className="mr-2 flex-shrink-0 text-green-500 dark:text-green-400"
                                />
                              ) : isVideo ? (
                                <FileVideo
                                  size={16}
                                  className="mr-2 flex-shrink-0 text-amber-500 dark:text-amber-400"
                                />
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400"
                                >
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              )}
                              <span className="truncate">{file.name}</span>
                            </div>
                            {file.size && !file.type.includes('dir') && (
                              <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                                {fileSize}
                              </span>
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

      {/* Advanced Editor Modal */}
      <EditorDialog open={showAdvancedEditorModal} onOpenChange={setShowAdvancedEditorModal}>
        <EditorDialogContent className="max-w-lg">
          <EditorDialogHeader>
            <EditorDialogTitle className="flex items-center gap-2 text-xl">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-500"
              >
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              </svg>
              Advanced Photo Editor
            </EditorDialogTitle>
            <EditorDialogDescription className="pt-2 text-base">
              You are about to access our premium Advanced Photo Editor, a separate product from us.
            </EditorDialogDescription>
          </EditorDialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/60">
              <h4 className="mb-2 flex items-center font-medium text-amber-800 dark:text-amber-300">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Important Information
              </h4>
              <ul className="space-y-2 pl-2 text-sm text-amber-700 dark:text-amber-300/90">
                <li>• This is a separate product requiring a separate subscription</li>
                <li>
                  • You&apos;ll need to create a new account on editor-dionysus-gray.vercel.app
                </li>
                <li>• We maintain the same security standards across all our products</li>
              </ul>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/60">
              <h4 className="mb-2 flex items-center font-medium text-purple-800 dark:text-purple-300">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Advanced Features
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-300/90">
                Gain access to professional-grade tools including advanced filters, croping, ai
                powered features, and precision retouching tools.
              </p>
            </div>
          </div>

          <EditorDialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedEditorModal(false)}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                window.open(
                  'https://editor-dionysus-gray.vercel.app',
                  '_blank',
                  'noopener,noreferrer',
                );
                setShowAdvancedEditorModal(false);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 sm:order-2"
            >
              Continue to Advanced Editor
            </Button>
          </EditorDialogFooter>
        </EditorDialogContent>
      </EditorDialog>
    </div>
  );
};

export default MediaOptimizer;
