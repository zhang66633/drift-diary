import type { Consequence, ProvidenceHook } from '../types/scene';
import type { StateManager } from './StateManager';

/**
 * 天意引擎 —— 不再维护独立的内部值，直接读取 state.天意。
 * {"type":"state","target":"天意"} 和 {"type":"providence"} 修改的是同一个值。
 */
export class ProvidenceEngine {
  private stateMgr: StateManager;

  constructor(stateMgr: StateManager) {
    this.stateMgr = stateMgr;
  }

  getValue(): number {
    return this.stateMgr.getState().天意;
  }

  modify(delta: number): void {
    this.stateMgr.modifyState('天意', delta);
  }

  setValue(v: number): void {
    this.stateMgr.setState('天意', v);
  }

  getLevel(): 'high' | 'mid' | 'low' {
    const v = this.getValue();
    if (v >= 65) return 'high';
    if (v <= 35) return 'low';
    return 'mid';
  }

  checkHook(hook: ProvidenceHook | undefined): Consequence[] | null {
    if (!hook) return null;
    const v = this.getValue();
    if (hook.lowThreshold !== undefined && v <= hook.lowThreshold) {
      return hook.lowEffects ?? hook.effects ?? null;
    }
    if (hook.highThreshold !== undefined && v >= hook.highThreshold) {
      return hook.highEffects ?? hook.effects ?? null;
    }
    return null;
  }
}
