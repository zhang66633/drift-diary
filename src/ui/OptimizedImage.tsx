import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  webpSrc?: string;
  lqipSrc?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

const preloadCache = new Set<string>();

export function preloadImage(src: string): Promise<void> {
  if (preloadCache.has(src)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      preloadCache.add(src);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function OptimizedImage({
  src,
  alt,
  className,
  webpSrc,
  lqipSrc,
  priority = false,
  loading = 'lazy',
  onLoad,
  style,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const finalLoading = priority ? 'eager' : loading;

  useEffect(() => {
    setLoaded(false);
    if (priority) {
      const targetSrc = webpSrc || src;
      if (preloadCache.has(targetSrc)) {
        setLoaded(true);
      }
    }
  }, [src, webpSrc, priority]);

  const handleLoad = () => {
    setLoaded(true);
    preloadCache.add(webpSrc || src);
    onLoad?.();
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const lqipStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit,
    filter: 'blur(20px) saturate(1.2)',
    opacity: loaded ? 0 : 1,
    transition: 'opacity 0.6s ease-out',
    transform: 'scale(1.1)',
    pointerEvents: 'none',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    opacity: loaded ? 1 : 0,
    transition: 'opacity 0.6s ease-out',
  };

  return (
    <div ref={containerRef} style={wrapperStyle} className={className}>
      {lqipSrc && (
        <img
          src={lqipSrc}
          alt=""
          aria-hidden="true"
          style={lqipStyle}
        />
      )}
      <picture>
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        <img
          src={src}
          alt={alt}
          loading={finalLoading}
          onLoad={handleLoad}
          style={imgStyle}
          decoding="async"
        />
      </picture>
    </div>
  );
}
