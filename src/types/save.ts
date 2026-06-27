import type { GameState } from './state';

export interface SaveSlot {
  id: string;
  type: 'auto' | 'manual' | 'diary';
  label: string;
  timestamp: number;
  gameState: GameState;
  sceneText: string;
}

export interface SaveData {
  version: string;
  slots: SaveSlot[];
  activeSlotId: string | null;
  unlockedEndings: string[];
}

export const SAVE_VERSION = '0.1.0';
export const SAVE_KEY = 'robinson_save';
