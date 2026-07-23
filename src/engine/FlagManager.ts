import type { FlagValue, Flags } from '../types/state';
import type { Condition } from '../types/scene';

export type { FlagValue, Flags };

export class FlagManager {
  private flags: Flags = {};

  constructor(initialFlags: Flags = {}) {
    this.flags = { ...initialFlags };
  }

  getFlag(key: string): FlagValue | undefined {
    return this.flags[key];
  }

  hasFlag(key: string): boolean {
    return key in this.flags;
  }

  setFlag(key: string, value: FlagValue): void {
    this.flags[key] = value;
  }

  pushFlag(key: string, value: string): void {
    const existing = this.flags[key];
    if (Array.isArray(existing)) {
      if (!existing.includes(value)) existing.push(value);
    } else {
      this.flags[key] = [value];
    }
  }

  removeFlag(key: string): void {
    delete this.flags[key];
  }

  reset(flags: Flags = {}): void {
    this.flags = { ...flags };
  }

  getAllFlags(): Readonly<Flags> {
    return this.flags;
  }

  checkCondition(
    condition: Condition | undefined,
    getState: () => Record<string, number>,
    getResource: () => Record<string, number>,
    getSkill: () => Record<string, number>,
    getProvidence: () => number,
  ): boolean {
    if (!condition) return true;

    if (condition.and) {
      return condition.and.every(c => this.checkCondition(c, getState, getResource, getSkill, getProvidence));
    }
    if (condition.or) {
      return condition.or.some(c => this.checkCondition(c, getState, getResource, getSkill, getProvidence));
    }
    if (!condition.type) return true;

    let value: number | FlagValue | undefined;
    switch (condition.type) {
      case 'flag':
        value = this.getFlag(condition.target!);
        break;
      case 'state':
        value = getState()[condition.target!];
        break;
      case 'resource':
        value = getResource()[condition.target!];
        break;
      case 'skill':
        value = getSkill()[condition.target!];
        break;
      case 'providence':
        value = getProvidence();
        break;
    }

    if (value === undefined) {
      if (condition.operator === 'not_in' || condition.operator === 'neq') return true;
      return false;
    }
    return this.compare(value, condition.operator!, condition.value);
  }

  private compare(
    actual: FlagValue | number,
    operator: Condition['operator'],
    expected: FlagValue | number | undefined,
  ): boolean {
    if (operator === 'in' && Array.isArray(expected)) {
      return expected.includes(String(actual));
    }
    if (operator === 'not_in' && Array.isArray(expected)) {
      return !expected.includes(String(actual));
    }

    const a = typeof actual === 'number' ? actual : String(actual);
    const b = typeof expected === 'number' ? expected : String(expected ?? '');

    switch (operator) {
      case 'eq': return a === b;
      case 'neq': return a !== b;
      case 'gt': return typeof a === 'number' && typeof b === 'number' && a > b;
      case 'lt': return typeof a === 'number' && typeof b === 'number' && a < b;
      case 'gte': return typeof a === 'number' && typeof b === 'number' && a >= b;
      case 'lte': return typeof a === 'number' && typeof b === 'number' && a <= b;
      default: return false;
    }
  }
}
