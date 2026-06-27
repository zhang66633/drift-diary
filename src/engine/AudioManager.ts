/**
 * AudioManager — 封装 Web Audio API，管理环境音循环和 UI 音效。
 *
 * - 背景音乐（bgm）：独立循环，音量较低
 * - 环境音（ambient）：无缝循环，场景切换时交叉渐变
 * - UI 音效（sfx）：一次性播放，不循环
 * - 主音量 + 音效音量独立控制
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
  private currentBgm: {
    key: BgmKey;
    source: AudioBufferSourceNode;
    gain: GainNode;
  } | null = null;
  private masterVolume = 0.8;  // 0-1
  private sfxVolume = 0.8;     // 0-1
  private bgmVolume = 0.3;     // 0-1
  private initialized = false;

  /** 用户首次交互后调用，解锁 AudioContext */
  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
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

  // ── 预加载 ──

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
    gain.connect(this.masterGain);  // ambient goes straight to master, not sfxGain

    if (this.currentAmbient && crossfade) {
      // 交叉渐变：旧音轨淡出，新音轨淡入
      const old = this.currentAmbient;
      const oldGain = old.gain;
      oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.0);
      // 延迟停止旧音轨
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

  async playBgm(key: BgmKey): Promise<void> {
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmGain) return;

    if (this.currentBgm?.key === key) return;

    const url = import.meta.env.BASE_URL + `audio/bgm/${key}.mp3`;
    await this.preload(`bgm_${key}`, url);
    const buffer = this.bufferCache[`bgm_${key}`];
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.connect(this.bgmGain);
    gain.gain.value = 0;

    if (this.currentBgm) {
      const old = this.currentBgm;
      old.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      setTimeout(() => {
        try { old.source.stop(); } catch { /* already stopped */ }
      }, 1700);
    }

    source.connect(gain);
    source.start(0);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);

    this.currentBgm = { key, source, gain };
  }

  stopBgm(): void {
    if (this.currentBgm) {
      const ctx = this.ctx;
      if (ctx) {
        this.currentBgm.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
        setTimeout(() => {
          try { this.currentBgm?.source.stop(); } catch { /* ok */ }
        }, 1200);
      } else {
        try { this.currentBgm.source.stop(); } catch { /* ok */ }
      }
      this.currentBgm = null;
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
    source.connect(this.sfxGain);
    source.start(0);
    // one-shot: stop after buffer duration
    source.onended = () => source.disconnect();
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
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.bufferCache = {};
    this.initialized = false;
  }
}
