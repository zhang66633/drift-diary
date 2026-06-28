import { isLowPerf } from './perf';
import { getIllustrationPaths } from './imageUtils';

export interface PreloadResource {
  type: 'image' | 'audio' | 'font' | 'scene';
  key: string;
  url?: string;
  weight?: number;
}

export interface PreloadOptions {
  onProgress?: (percent: number) => void;
  lowPerfMode?: boolean;
}

async function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

async function loadAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.oncanplaythrough = () => resolve();
    audio.onerror = () => resolve();
    audio.src = url;
    audio.load();
  });
}

async function loadFont(fontFamily: string): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  try {
    await (document.fonts as FontFaceSet).load(`1em "${fontFamily}"`);
  } catch {
    // 静默失败
  }
}

export async function preloadCriticalResources(
  options: PreloadOptions = {}
): Promise<void> {
  const { onProgress, lowPerfMode = isLowPerf() } = options;

  const baseUrl = import.meta.env.BASE_URL;

  const resources: PreloadResource[] = [];

  // 首屏关键插图（第一章第一个场景）
  const firstSceneImg = 'illustrations/ch1_1_父训.png';
  const imgPaths = getIllustrationPaths(firstSceneImg, baseUrl);
  resources.push({
    type: 'image',
    key: 'first-scene-webp',
    url: imgPaths.webp,
    weight: 20,
  });

  // 低性能模式下，只预加载最关键的首图
  if (!lowPerfMode) {
    resources.push({
      type: 'image',
      key: 'first-scene-lqip',
      url: imgPaths.lqip,
      weight: 2,
    });

    resources.push({
      type: 'audio',
      key: 'main-theme',
      url: `${baseUrl}audio/bgm/main_theme.mp3`,
      weight: 15,
    });

    resources.push({
      type: 'font',
      key: 'noto-serif-sc',
      weight: 5,
    });

    // 预加载第二章插图（如果用户快速推进）
    const ch2Img = 'illustrations/ch2_11_葡船.png';
    const ch2Paths = getIllustrationPaths(ch2Img, baseUrl);
    resources.push({
      type: 'image',
      key: 'ch2-first-webp',
      url: ch2Paths.webp,
      weight: 10,
    });
  }

  const totalWeight = resources.reduce((sum, r) => sum + (r.weight ?? 1), 0);
  let completedWeight = 0;

  const updateProgress = (addedWeight: number) => {
    completedWeight += addedWeight;
    const percent = (completedWeight / totalWeight) * 100;
    onProgress?.(percent);
  };

  // 按顺序加载，避免并发过高
  for (const resource of resources) {
    const weight = resource.weight ?? 1;

    try {
      switch (resource.type) {
        case 'image':
          if (resource.url) await loadImage(resource.url);
          break;
        case 'audio':
          if (resource.url) await loadAudio(resource.url);
          break;
        case 'font':
          await loadFont('Noto Serif SC');
          break;
      }
    } catch {
      // 静默失败，不阻塞整体进度
    }

    updateProgress(weight);
  }

  onProgress?.(100);
}
