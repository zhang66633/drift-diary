import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../types/state';

describe('createInitialState', () => {
  it('应返回带默认值的初始状态', () => {
    const state = createInitialState();
    expect(state.state.良心).toBe(50);
    expect(state.state.健康).toBe(100);
    expect(state.resources.墨水).toBe(0);
    expect(state.skills.航海).toBe(0);
    expect(state.history).toEqual([]);
    expect(state.historySnapshots).toEqual([]);
  });

  it('每次调用应返回独立对象', () => {
    const a = createInitialState();
    const b = createInitialState();
    a.state.良心 = 99;
    expect(b.state.良心).toBe(50);
  });
});
