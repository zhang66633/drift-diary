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
  mode?: 'critical' | 'full';
}

const ALL_ILLUSTRATIONS = [
  'ch1_1_父训',
  'ch1_5_风暴',
  'ch1_8_岸上',
  'ch1_9_归途',
  'ch2_3_宁死不屈',
  'ch2_7_迷失',
  'ch2_7_饿死',
  'ch2_8_猎狮',
  'ch2_9_怯懦',
  'ch2_11_葡船',
  'ch2_14_安分',
  'ch2_16_荒岛',
];

const ALL_BGM = [
  'main_theme',
  'dream',
  'ending_hope',
  'ending_sad',
  'harbor',
  'island',
  'ship',
  'storm',
  'tense',
];

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
  const { onProgress, mode = isLowPerf() ? 'critical' : 'full' } = options;

  const baseUrl = import.meta.env.BASE_URL;
  const resources: PreloadResource[] = [];

  if (mode === 'full') {
    for (const name of ALL_ILLUSTRATIONS) {
      const paths = getIllustrationPaths(`illustrations/${name}.webp`, baseUrl);
      resources.push({
        type: 'image',
        key: `img-${name}`,
        url: paths.webp,
        weight: 3,
      });
    }
    for (const name of ALL_BGM) {
      resources.push({
        type: 'audio',
        key: `bgm-${name}`,
        url: `${baseUrl}audio/bgm/${name}.mp3`,
        weight: 5,
      });
    }
    resources.push({
      type: 'font',
      key: 'noto-serif-sc',
      weight: 3,
    });
  } else {
    const firstSceneImg = 'illustrations/ch1_1_父训.webp';
    const imgPaths = getIllustrationPaths(firstSceneImg, baseUrl);
    resources.push({
      type: 'image',
      key: 'first-scene-webp',
      url: imgPaths.webp,
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

export function getPreloadMode(): 'critical' | 'full' {
  return isLowPerf() ? 'critical' : 'full';
}
