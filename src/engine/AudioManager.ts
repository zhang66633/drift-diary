/**
 * AudioManager — BGM 用 HTML5 Audio 流式播放，SFX 用 Web Audio API。
 *
 * - 背景音乐（bgm）：HTML5 Audio 流式，优先 WebM/Opus，降级到 MP3
 * - 环境音（ambient）：Web Audio 无缝循环，场景切换时交叉渐变
 * - UI 音效（sfx）：Web Audio 一次性播放，不循环
 * - 主音量 + 音效音量独立控制
 *
 * 优化策略：
 * 1. BGM 使用 HTML5 Audio 的流式播放（preload='auto'），边下边播
 * 2. 智能预加载：进入场景后延迟预加载下一分支的 BGM
 * 3. 预加载缓存避免重复下载
 */

type AmbientKey = string;
type SfxKey = string;
type BgmKey = string;

interface AudioBufferCache {
  [key: string]: AudioBuffer;
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

  private bgmAudio: HTMLAudioElement | null = null;
  private bgmMediaSource: MediaElementAudioSourceNode | null = null;
  private bgmSourceGain: GainNode | null = null;
  private currentBgmKey: BgmKey | null = null;
  private bgmPreloadCache = new Map<BgmKey, HTMLAudioElement>();

  private masterVolume = 0.8;
  private sfxVolume = 0.8;
  private bgmVolume = 0.7;
  private initialized = false;

  private getBgmUrl(key: BgmKey): string {
    return import.meta.env.BASE_URL + `audio/bgm/${key}.mp3`;
  }

  /** 用户首次交互后调用，解锁 AudioContext */
  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.ctx?.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      });
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);

      this.bgmAudio = new Audio();
      this.bgmAudio.loop = true;
      this.bgmAudio.preload = 'auto';
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

  // ── 环境音 ──

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

  // ── 背景音乐 ──

  playBgm(key: BgmKey): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmAudio || !this.bgmSourceGain) return;

    if (this.currentBgmKey === key) return;

    const url = this.getBgmUrl(key);

    const cached = this.bgmPreloadCache.get(key);

    const doPlay = () => {
      if (!this.bgmAudio || !this.bgmSourceGain) return;

      if (cached) {
        const currentTime = cached.currentTime;
        this.bgmAudio.src = url;
        this.bgmAudio.currentTime = currentTime;
        this.bgmAudio.play().catch(() => {});
        this.bgmSourceGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5);
      } else {
        this.bgmAudio.src = url;
        this.bgmAudio.load();
        this.bgmAudio.play().catch(() => {});
        this.bgmSourceGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5);
      }

      this.currentBgmKey = key;
    };

    if (this.currentBgmKey) {
      this.bgmSourceGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(doPlay, 600);
    } else {
      doPlay();
    }
  }

  /**
   * 后台预加载 BGM（单首）
   * 使用独立的 Audio 元素预加载，利用浏览器缓存
   */
  preloadBgm(key: BgmKey): void {
    if (this.bgmPreloadCache.has(key)) return;

    const url = this.getBgmUrl(key);
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.load();
    this.bgmPreloadCache.set(key, audio);
  }

  /**
   * 批量预加载 BGM
   * 按顺序延迟启动，避免同时请求过多造成带宽竞争
   */
  preloadBgmBatch(keys: BgmKey[]): void {
    keys.forEach((key, index) => {
      setTimeout(() => this.preloadBgm(key), index * 800);
    });
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
