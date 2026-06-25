import type { Consequence, ProvidenceHook } from '../types/scene';

export class ProvidenceEngine {
  private value: number;

  constructor(initial: number = 50) {
    this.value = Math.max(0, Math.min(100, initial));
  }

  getValue(): number {
    return this.value;
  }

  modify(delta: number): void {
    this.value = Math.max(0, Math.min(100, this.value + delta));
  }

  setValue(v: number): void {
    this.value = Math.max(0, Math.min(100, v));
  }

  getLevel(): 'high' | 'mid' | 'low' {
    if (this.value >= 65) return 'high';
    if (this.value <= 35) return 'low';
    return 'mid';
  }

  checkHook(hook: ProvidenceHook | undefined): Consequence[] | null {
    if (!hook) return null;
    if (hook.lowThreshold !== undefined && this.value <= hook.lowThreshold) {
      return hook.effects;
    }
    if (hook.highThreshold !== undefined && this.value >= hook.highThreshold) {
      return hook.effects;
    }
    return null;
  }
}
