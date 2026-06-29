export interface IllustrationPaths {
  original: string;
  webp: string;
  lqip: string;
}

export function getIllustrationPaths(src: string, baseUrl: string = import.meta.env.BASE_URL): IllustrationPaths {
  const normalizedSrc = src.replace(/^\//, '');
  const fullSrc = baseUrl + normalizedSrc;

  // Strip extension to derive alternate formats
  const basePath = fullSrc.replace(/\.(png|webp|jpg|jpeg)$/i, '');

  const webpPath = basePath + '.webp';

  const lqipDirIndex = normalizedSrc.lastIndexOf('/');
  const lqipBase = lqipDirIndex > -1 ? normalizedSrc.slice(0, lqipDirIndex + 1) + 'lqip/' + normalizedSrc.slice(lqipDirIndex + 1) : 'lqip/' + normalizedSrc;
  const lqipFull = baseUrl + lqipBase;
  const lqipPath = lqipFull.replace(/\.(png|webp|jpg|jpeg)$/i, '.jpg');

  return {
    original: fullSrc,
    webp: webpPath,
    lqip: lqipPath,
  };
}

const preloadPromises = new Map<string, Promise<void>>();

export function preloadIllustration(src: string | null | undefined, baseUrl?: string): Promise<void> {
  if (!src) return Promise.resolve();

  const paths = getIllustrationPaths(src, baseUrl);
  const key = paths.webp;

  if (preloadPromises.has(key)) {
    return preloadPromises.get(key)!;
  }

  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => resolve();
      fallback.onerror = () => resolve();
      fallback.src = paths.original;
    };
    img.src = paths.webp;
  });

  preloadPromises.set(key, promise);
  return promise;
}
