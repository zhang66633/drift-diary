/**
 * AudioManager — BGM 用 HTML5 Audio 流式播放，SFX 用 Web Audio API。
 *
 * - 背景音乐（bgm）：HTML5 Audio 流式，即时播放无需完整下载
 * - 环境音（ambient）：Web Audio 无缝循环，场景切换时交叉渐变
 * - UI 音效（sfx）：Web Audio 一次性播放，不循环
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

  // ── BGM：HTML5 Audio 流式播放 ──
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmMediaSource: MediaElementAudioSourceNode | null = null;
  private bgmSourceGain: GainNode | null = null;
  private currentBgmKey: BgmKey | null = null;

  private masterVolume = 0.8;  // 0-1
  private sfxVolume = 0.8;     // 0-1
  private bgmVolume = 0.7;     // 0-1
  private initialized = false;

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

  // ── 背景音乐（HTML5 Audio 流式，即时播放） ──

  /** 切换 BGM — 首次调用须在用户手势内，确保移动端不拦截 */
  playBgm(key: BgmKey): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmAudio || !this.bgmSourceGain) return;

    if (this.currentBgmKey === key) return;

    const url = import.meta.env.BASE_URL + `audio/bgm/${key}.mp3`;

    const doPlay = () => {
      this.bgmAudio!.src = url;
      this.bgmAudio!.load();
      // play() 必须在同步调用栈内，移动端才放行
      this.bgmAudio!.play().catch(() => {});
      this.bgmSourceGain!.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5);
      this.currentBgmKey = key;
    };

    if (this.currentBgmKey) {
      // 淡出当前 BGM，稍后切入新曲
      this.bgmSourceGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(doPlay, 600);
    } else {
      doPlay();
    }
  }

  /** 后台预加载 BGM 文件到浏览器缓存，切换时即刻播放 */
  preloadBgm(key: BgmKey): void {
    if (!this.bgmAudio) return;
    const url = import.meta.env.BASE_URL + `audio/bgm/${key}.mp3`;
    // 创建临时 Audio 元素触发浏览器缓存预热，不播放
    const tmp = new Audio();
    tmp.preload = 'auto';
    tmp.src = url;
    tmp.load();
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
    this.initialized = false;
  }
}
