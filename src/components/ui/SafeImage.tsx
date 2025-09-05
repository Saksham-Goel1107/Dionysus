'use client';

import ImageNext from 'next/image';


function isValidImageSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  
  // Explicitly block potential XSS schemes
  const forbiddenSchemes = ['javascript:', 'vbscript:', 'file:'];
  const lowerSrc = src.toLowerCase().trim();
  for (const scheme of forbiddenSchemes) {
    if (lowerSrc.startsWith(scheme)) {
      return false;
    }
  }
  
  // Only allow http, https, or *image* data URIs, and safe relative image paths
  if (lowerSrc.startsWith('data:image/')) {
    return true;
  }
  // Optionally require relative paths to look like images (ending with common img extensions)
  const imageExtRegex = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
  try {
    const url = new URL(src, window.location.origin);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      // Optionally check pathname for image extension
      return imageExtRegex.test(url.pathname);
    }
    return false;
  } catch {
    // If it's a relative path (not absolute), check for image extension
    return typeof src === 'string' && src.startsWith('/') && imageExtRegex.test(src);
  }
}

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

export default function SafeImage({
  src,
  alt = '',
  width,
  height,
  className = '',
  ...rest
}: SafeImageProps) {
  if (!isValidImageSrc(src)) {
    return <div className={`bg-gray-100 dark:bg-gray-900 ${className}`} aria-hidden />;
  }

  try {
    // External host - use plain <img> to avoid next/image host validation
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        {...rest}
        onError={(e) => {
          const t = e.target as HTMLImageElement;
          t.style.display = 'none';
        }}
      />
    );
  } catch {
    // Not a valid absolute URL - assume internal asset
    return (
      <ImageNext
        src={src}
        alt={alt}
        width={width || 300}
        height={height || 200}
        className={className}
        {...(rest as any)}
      />
    );
  }
}
