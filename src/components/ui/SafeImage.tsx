'use client';

import ImageNext from 'next/image';

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
  if (!src) {
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
