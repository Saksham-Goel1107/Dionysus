'use client';

import ImageNext from 'next/image';


function isValidImageSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  try {
    // Allow http, https, and data:image only
    if (src.startsWith('data:image/')) {
      return true;
    }
    const url = new URL(src, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    // If it's a relative path, it will parse as http(s) with window.location.origin
    return typeof src === 'string' && src.startsWith('/');
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
