import { useRef, useEffect } from 'react';
import { isLowPerf } from '../utils/perf';

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
  const imgRef = useRef<HTMLImageElement>(null);
  const lqipRef = useRef<HTMLImageElement>(null);
  const finalLoading = priority ? 'eager' : loading;
  const lowPerf = isLowPerf();

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      onLoad?.();
    }
  }, [src, webpSrc, onLoad]);

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    background: lowPerf ? '#d4c4a8' : undefined,
    ...style,
  };

  const lqipStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit,
    filter: 'blur(20px) saturate(1.2)',
    transform: 'scale(1.1)',
    pointerEvents: 'none',
    opacity: 1,
    transition: 'opacity 0.5s ease-out',
  };

  const handleLoad = () => {
    // Use ref instead of fragile DOM traversal
    if (lqipRef.current) {
      lqipRef.current.style.opacity = '0';
    }
    preloadCache.add(webpSrc || src);
    onLoad?.();
  };

  const showLqip = !lowPerf && !!lqipSrc;

  return (
    <div style={wrapperStyle} className={className}>
      {showLqip && (
        <img
          ref={lqipRef}
          src={lqipSrc}
          alt=""
          aria-hidden="true"
          className="opt-lqip"
          style={lqipStyle}
          loading="eager"
          decoding="async"
        />
      )}
      <picture>
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={finalLoading}
          onLoad={handleLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: 1,
            transition: lowPerf ? 'none' : 'opacity 0.5s ease-out',
          }}
          decoding="async"
        />
      </picture>
    </div>
  );
}
