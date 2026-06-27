import type { GameState } from '../types/state';
import type { SaveData, SaveSlot } from '../types/save';
import { SAVE_KEY, SAVE_VERSION } from '../types/save';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const localStorageAdapter: StorageAdapter = {
  getItem: (k) => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(k);
  },
  setItem: (k, v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  removeItem: (k) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

const MANUAL_SLOTS = 6;
const AUTO_SLOT_ID = 'auto';

export class SaveManager {
  private storage: StorageAdapter;
  private data: SaveData;

  constructor(storage: StorageAdapter = localStorageAdapter) {
    this.storage = storage;
    this.data = this.loadFromStorage();
  }

  listSlots(): SaveSlot[] {
    return [...this.data.slots].sort((a, b) => b.timestamp - a.timestamp);
  }

  getSlot(slotId: string): SaveSlot | null {
    return this.data.slots.find(s => s.id === slotId) ?? null;
  }

  save(slotId: string, label: string, gameState: GameState, sceneText: string, type: SaveSlot['type'] = 'manual'): void {
    // 手动槽位限制
    if (type === 'manual' && !slotId.startsWith('manual_')) {
      slotId = `manual_${slotId}`;
    }
    const existing = this.data.slots.findIndex(s => s.id === slotId);
    const slot: SaveSlot = {
      id: slotId,
      type,
      label,
      timestamp: Date.now(),
      gameState: this.cloneState(gameState),
      sceneText,
    };
    if (existing >= 0) {
      this.data.slots[existing] = slot;
    } else {
      this.data.slots.push(slot);
    }
    // 清理过多手动存档
    const manualSlots = this.data.slots.filter(s => s.type === 'manual');
    if (manualSlots.length > MANUAL_SLOTS) {
      manualSlots.sort((a, b) => b.timestamp - a.timestamp);
      const toRemove = manualSlots.slice(MANUAL_SLOTS);
      for (const s of toRemove) {
        this.data.slots = this.data.slots.filter(x => x.id !== s.id);
      }
    }
    this.data.activeSlotId = slotId;
    this.persist();
  }

  autoSave(label: string, gameState: GameState, sceneText: string): void {
    this.save(AUTO_SLOT_ID, label, gameState, sceneText, 'auto');
  }

  load(slotId: string): GameState | null {
    const slot = this.getSlot(slotId);
    if (!slot) return null;
    this.data.activeSlotId = slotId;
    this.persist();
    return this.cloneState(slot.gameState);
  }

  deleteSlot(slotId: string): void {
    this.data.slots = this.data.slots.filter(s => s.id !== slotId);
    if (this.data.activeSlotId === slotId) {
      this.data.activeSlotId = null;
    }
    this.persist();
  }

  hasSave(): boolean {
    return this.data.slots.length > 0;
  }

  getLatestSave(): SaveSlot | null {
    if (this.data.slots.length === 0) return null;
    return [...this.data.slots].sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  getUnlockedEndings(): string[] {
    return [...this.data.unlockedEndings];
  }

  unlockEnding(sceneId: string): void {
    if (!this.data.unlockedEndings.includes(sceneId)) {
      this.data.unlockedEndings.push(sceneId);
      this.persist();
    }
  }

  migrate(oldSave: SaveData): SaveData {
    // 预留版本迁移逻辑
    return oldSave;
  }

  private loadFromStorage(): SaveData {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) {
      return { version: SAVE_VERSION, slots: [], activeSlotId: null, unlockedEndings: [] };
    }
    try {
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.version !== SAVE_VERSION) {
        return this.migrate(parsed);
      }
      if (!parsed.unlockedEndings) parsed.unlockedEndings = [];
      return parsed;
    } catch {
      return { version: SAVE_VERSION, slots: [], activeSlotId: null, unlockedEndings: [] };
    }
  }

  private persist(): void {
    this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  private cloneState(state: GameState): GameState {
    return JSON.parse(JSON.stringify(state));
  }
}
