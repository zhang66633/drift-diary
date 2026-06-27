import { create } from 'zustand';

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';

const TEXT_SPEED_MAP: Record<TextSpeed, number> = {
  slow: 60,
  normal: 30,
  fast: 15,
  instant: 0,
};

interface SettingsState {
  textSpeed: TextSpeed;
  debugMode: boolean;
  volume: number;
}

interface SettingsStore extends SettingsState {
  setTextSpeed: (speed: TextSpeed) => void;
  setDebugMode: (on: boolean) => void;
  setVolume: (v: number) => void;
  getTypingIntervalMs: () => number;
  toggleDebug: () => void;
}

const STORAGE_KEY = 'robinson_settings';

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        textSpeed: parsed.textSpeed ?? 'normal',
        debugMode: parsed.debugMode ?? false,
        volume: parsed.volume ?? 80,
      };
    }
  } catch { /* ignore */ }
  return {
    textSpeed: 'normal',
    debugMode: false,
    volume: 80,
  };
}

function persist(state: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export const useSettings = create<SettingsStore>((set, get) => ({
  ...loadSettings(),

  setTextSpeed(speed) {
    set({ textSpeed: speed });
    persist({ ...get() });
  },

  setDebugMode(on) {
    set({ debugMode: on });
    persist({ ...get() });
  },

  setVolume(v) {
    set({ volume: Math.max(0, Math.min(100, v)) });
    persist({ ...get() });
  },

  getTypingIntervalMs() {
    return TEXT_SPEED_MAP[get().textSpeed];
  },

  toggleDebug() {
    const next = !get().debugMode;
    set({ debugMode: next });
    persist({ ...get(), debugMode: next });
  },
}));
