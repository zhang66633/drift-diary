/**
 * AudioManager — BGM 用 HTML5 Audio 流式播放，SFX 用 Web Audio API。
 *
 * - 背景音乐（bgm）：HTML5 Audio 流式，渐进式加载（低码率→高码率）
 * - 环境音（ambient）：Web Audio 无缝循环，场景切换时交叉渐变
 * - UI 音效（sfx）：Web Audio 一次性播放，不循环
 * - 主音量 + 音效音量独立控制
 *
 * 渐进式 BGM 加载策略：
 * 1. 先播放低码率版本（32kbps，体积约原始 25%），快速出声
 * 2. 后台预加载高码率版本（原始 128kbps 或压缩版 64kbps）
 * 3. 高码率版本就绪后，无缝切换到高清音质
 */

type AmbientKey = string;
type SfxKey = string;
type BgmKey = string;

interface AudioBufferCache {
  [key: string]: AudioBuffer;
}

interface BgmPreloadState {
  lowReady: boolean;
  highReady: boolean;
  lowUrl: string;
  highUrl: string;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private bufferCache: AudioBufferCache = {};
  private currentAmbient: {
    key: AmbientKey;
    source: AudioBufferSourceNode;
    gain: GainNode;
  } | null = null;

  // ── BGM：HTML5 Audio 渐进式流式播放 ──
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmMediaSource: MediaElementAudioSourceNode | null = null;
  private bgmSourceGain: GainNode | null = null;
  private currentBgmKey: BgmKey | null = null;
  private bgmPreloadCache = new Map<BgmKey, BgmPreloadState>();

  private masterVolume = 0.8;  // 0-1
  private sfxVolume = 0.8;     // 0-1
  private bgmVolume = 0.7;     // 0-1
  private initialized = false;

  /** 获取 BGM 的低码率和原始 URL */
  private getBgmUrls(key: BgmKey): { lowUrl: string; highUrl: string } {
    const base = import.meta.env.BASE_URL + 'audio/bgm';
    return {
      lowUrl: `${base}/low/${key}.mp3`,
      highUrl: `${base}/${key}.mp3`,
    };
  }

  /** 用户首次交互后调用，解锁 AudioContext */
  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      // 页面切后台再回来时自动恢复 AudioContext
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.ctx?.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      });
      // 主音量 → destination
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
      // 音效音量 → master
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      // 背景音乐音量 → master
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);

      // 创建 BGM Audio 元素（贯穿游戏生命期，只创建一次）
      this.bgmAudio = new Audio();
      this.bgmAudio.loop = true;
      this.bgmAudio.preload = 'auto';
      // 通过 MediaElementSourceNode 接入 Web Audio 增益链
      this.bgmMediaSource = this.ctx.createMediaElementSource(this.bgmAudio);
      this.bgmSourceGain = this.ctx.createGain();
      this.bgmSourceGain.gain.value = 0;
      this.bgmMediaSource.connect(this.bgmSourceGain);
      this.bgmSourceGain.connect(this.bgmGain);

      this.initialized = true;
    } catch {
      console.warn('AudioContext not available');
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.initialized || !this.ctx) return null;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // ── 预加载（仅 SFX / ambient 用 Web Audio buffer） ──

  async preload(key: string, url: string): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.bufferCache[key]) return;
    try {
      const resp = await fetch(url);
      const arrayBuffer = await resp.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache[key] = audioBuffer;
    } catch {
      console.warn(`AudioManager: failed to preload ${key}`);
    }
  }

  // ── 环境音（保留 Web Audio — 无缝循环 + 交叉渐变） ──

  async playAmbient(key: AmbientKey, crossfade = true): Promise<void> {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const url = import.meta.env.BASE_URL + `audio/ambient/${key}.mp3`;
    await this.preload(key, url);
    const buffer = this.bufferCache[key];
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.connect(this.masterGain);

    if (this.currentAmbient && crossfade) {
      const old = this.currentAmbient;
      const oldGain = old.gain;
      oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.0);
      setTimeout(() => {
        try { old.source.stop(); } catch { /* already stopped */ }
      }, 1200);
    } else {
      gain.gain.value = 1;
    }

    source.connect(gain);
    source.start(0);

    this.currentAmbient = { key, source, gain };
  }

  stopAmbient(): void {
    if (this.currentAmbient) {
      try { this.currentAmbient.source.stop(); } catch { /* ok */ }
      this.currentAmbient = null;
    }
  }

  // ── 背景音乐（HTML5 Audio 渐进式加载） ──

  /**
   * 切换 BGM — 渐进式加载：
   * 1. 先用低码率版本快速开始播放
   * 2. 高码率版本就绪后无缝升级
   */
  playBgm(key: BgmKey): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmAudio || !this.bgmSourceGain) return;

    if (this.currentBgmKey === key) return;

    const { lowUrl, highUrl } = this.getBgmUrls(key);
    const cachedState = this.bgmPreloadCache.get(key);
    const highReady = cachedState?.highReady ?? false;

    const doPlay = () => {
      if (!this.bgmAudio || !this.bgmSourceGain) return;

      // 优先播放高码率版本（如果已预加载完成），否则先播放低码率
      const srcUrl = highReady ? highUrl : lowUrl;
      this.bgmAudio.src = srcUrl;
      this.bgmAudio.load();
      this.bgmAudio.play().catch(() => {});
      this.bgmSourceGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5);
      this.currentBgmKey = key;

      // 如果播放的是低码率版本，后台加载高码率版本
      if (!highReady) {
        this.upgradeToHighQuality(key, highUrl);
      }
    };

    if (this.currentBgmKey) {
      // 淡出当前 BGM，稍后切入新曲
      this.bgmSourceGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(doPlay, 600);
    } else {
      doPlay();
    }
  }

  /** 后台加载高码率 BGM，就绪后无缝替换低码率版本 */
  private upgradeToHighQuality(key: BgmKey, highUrl: string): void {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = highUrl;

    const canPlay = () => {
      // 仅在当前播放的是同一首 BGM 时才升级
      if (this.currentBgmKey === key && this.bgmAudio) {
        const currentTime = this.bgmAudio.currentTime;
        // 在当前播放位置无缝切换到高码率版本
        this.bgmAudio.src = highUrl;
        this.bgmAudio.currentTime = currentTime;
        this.bgmAudio.play().catch(() => {});

        // 更新预加载缓存
        const state = this.bgmPreloadCache.get(key);
        if (state) state.highReady = true;
      }
      audio.removeEventListener('canplaythrough', canPlay);
    };

    audio.addEventListener('canplaythrough', canPlay);
    audio.load();
  }

  /**
   * 后台预加载 BGM（低码率 + 高码率双版本）
   * 首次预加载时同时开始下载两个版本
   */
  preloadBgm(key: BgmKey): void {
    if (this.bgmPreloadCache.has(key)) return;

    const { lowUrl, highUrl } = this.getBgmUrls(key);
    const state: BgmPreloadState = { lowReady: false, highReady: false, lowUrl, highUrl };
    this.bgmPreloadCache.set(key, state);

    // 预加载低码率版本（极小，秒级完成）
    const lowAudio = new Audio();
    lowAudio.preload = 'auto';
    lowAudio.src = lowUrl;
    lowAudio.addEventListener('canplaythrough', () => { state.lowReady = true; }, { once: true });
    lowAudio.addEventListener('error', () => { /* 静默 */ }, { once: true });
    lowAudio.load();

    // 预加载高码率版本（较大，后台下载）
    const highAudio = new Audio();
    highAudio.preload = 'auto';
    highAudio.src = highUrl;
    highAudio.addEventListener('canplaythrough', () => { state.highReady = true; }, { once: true });
    highAudio.addEventListener('error', () => { /* 静默 */ }, { once: true });
    highAudio.load();
  }

  /**
   * 预加载多首 BGM（用于预判下一步可能的场景）
   * 同时启动所有指定 BGM 的预加载
   */
  preloadBgmBatch(keys: BgmKey[]): void {
    for (const key of keys) {
      this.preloadBgm(key);
    }
  }

  stopBgm(): void {
    if (!this.bgmAudio || !this.currentBgmKey) return;
    const ctx = this.ctx;
    if (ctx && this.bgmSourceGain) {
      this.bgmSourceGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      setTimeout(() => {
        this.bgmAudio?.pause();
        this.currentBgmKey = null;
      }, 1200);
    } else {
      this.bgmAudio.pause();
      this.currentBgmKey = null;
    }
  }

  setBgmVolume(v: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, v / 100));
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.bgmVolume;
    }
  }

  getBgmVolume(): number {
    return Math.round(this.bgmVolume * 100);
  }

  // ── UI 音效 ──

  async playSfx(key: SfxKey): Promise<void> {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const url = import.meta.env.BASE_URL + `audio/sfx/${key}.mp3`;
    await this.preload(key, url);
    const buffer = this.bufferCache[key];
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    // 为短促音效增加音量提升，确保翻页等细微声音可听见
    const boost = ctx.createGain();
    boost.gain.value = 1.8;
    boost.connect(this.sfxGain);
    source.connect(boost);
    source.start(0);
    source.onended = () => {
      boost.disconnect();
      source.disconnect();
    };
  }

  // ── 音量控制 ──

  setMasterVolume(v: number): void {
    this.masterVolume = Math.max(0, Math.min(1, v / 100));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v / 100));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  getMasterVolume(): number {
    return Math.round(this.masterVolume * 100);
  }

  getSfxVolume(): number {
    return Math.round(this.sfxVolume * 100);
  }

  // ── 清理 ──

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  destroy(): void {
    this.stopAmbient();
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.removeAttribute('src');
      this.bgmAudio = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.bufferCache = {};
    this.bgmPreloadCache.clear();
    this.initialized = false;
  }
}
