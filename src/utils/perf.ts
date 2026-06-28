export type PerfLevel = 'high' | 'medium' | 'low';

let cachedLevel: PerfLevel | null = null;

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function getDeviceMemory(): number {
  if (typeof navigator === 'undefined') return 4;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return nav.deviceMemory ?? 4;
}

function getCpuCores(): number {
  if (typeof navigator === 'undefined') return 4;
  return navigator.hardwareConcurrency ?? 4;
}

function getConnectionType(): string {
  if (typeof navigator === 'undefined') return '4g';
  const nav = navigator as Navigator & {
    connection?: { effectiveType: string; saveData?: boolean };
  };
  return nav.connection?.effectiveType ?? '4g';
}

function isSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    connection?: { effectiveType: string; saveData?: boolean };
  };
  return nav.connection?.saveData ?? false;
}

export function detectPerfLevel(): PerfLevel {
  if (cachedLevel !== null) return cachedLevel;

  if (typeof window === 'undefined') {
    cachedLevel = 'high';
    return cachedLevel;
  }

  if (isSaveData()) {
    cachedLevel = 'low';
    return cachedLevel;
  }

  const memory = getDeviceMemory();
  const cores = getCpuCores();
  const mobile = isMobile();
  const conn = getConnectionType();

  let score = 0;

  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;
  else score -= 1;

  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  else score -= 1;

  if (mobile) score -= 1;

  if (conn === '4g' || conn === '5g' || conn === 'wifi') score += 1;
  else if (conn === '3g') score -= 1;
  else if (conn === '2g' || conn === 'slow-2g') score -= 2;

  if (score >= 3) cachedLevel = 'high';
  else if (score >= 0) cachedLevel = 'medium';
  else cachedLevel = 'low';

  return cachedLevel;
}

export function isLowPerf(): boolean {
  return detectPerfLevel() === 'low';
}

export function applyPerfClass(): void {
  if (typeof document === 'undefined') return;
  const level = detectPerfLevel();
  document.documentElement.classList.add(`perf-${level}`);
  if (level === 'low') {
    document.documentElement.classList.add('perf-degraded');
  }
}
