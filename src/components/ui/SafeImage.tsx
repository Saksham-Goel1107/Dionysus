'use client';

import ImageNext from 'next/image';


// Accept only strictly safe image sources to mitigate XSS
function isValidImageSrc(src: string | null | undefined): boolean {
  if (!src) return false;

  // Explicitly block suspicious schemes
  const forbiddenSchemes = ['javascript:', 'vbscript:', 'file:', '//'];
  const lowerSrc = src.toLowerCase().trim();
  for (const scheme of forbiddenSchemes) {
    if (lowerSrc.startsWith(scheme)) {
      return false;
    }
  }

  // Only allow http, https, or strictly-checked data URIs, and safe relative image paths
  if (lowerSrc.startsWith('data:image/')) {
    // Block SVG images in data URIs (XSS vector!)
    if (/^data:image\/svg\+xml/i.test(lowerSrc)) {
      return false;
    }
    // Allow only safe mimetypes: png, jpeg, jpg, gif, webp _only_, no SVG or others
    if (/^data:image\/(png|jpg|jpeg|gif|webp);/i.test(lowerSrc)) {
      return true;
    }
    // Otherwise disallow
    return false;
  }
  // Only allow http(s): URLs and block everything else (including //, blob:, ftp:, etc)
  const imageExtRegex = /\.(jpg|jpeg|png|gif|webp)$/i; // No svg
  try {
    const url = new URL(src, window.location.origin);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      // Do NOT allow SVGs or anything else (edge cases)
      if (/\.svg$/i.test(url.pathname)) {
        return false;
      }
      return imageExtRegex.test(url.pathname);
    }
    return false;
  } catch {
    // Only safe relative paths (/images/example.jpg), not protocol-relative
    if (typeof src === 'string' && src.startsWith('/') && imageExtRegex.test(src) && !/\.svg$/i.test(src)) {
      return true;
    }
    return false;
  }
  // At this point, src passes tight validation. Now opt for next/image for all (if possible),
  // falling back to img only for http(s) URLs, never for data: or relative.
  let isHttp = false;
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
    const url = new URL(src as string, window.location.origin);
    isHttp = url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    isHttp = false;
  }

  if (isHttp) {
    // Use <img> for external, but we've validated scheme/extension.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src as string}
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
  // Otherwise, use next/image for all else (including /relative and data: URIs, but only strictly safe types).
  return (
    <ImageNext
      src={src as string}
      alt={alt}
      width={width || 300}
      height={height || 200}
      className={className}
      {...(rest as any)}
    />
  );
  }
}
