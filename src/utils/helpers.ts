import type { Resources } from '../types/state';
import type { Condition } from '../types/scene';
import type { FlagManager } from '../engine/FlagManager';
import type { StateManager } from '../engine/StateManager';
import type { ProvidenceEngine } from '../engine/ProvidenceEngine';

export const RESOURCE_KEYS = [
  '钱', '食物', '淡水', '火药', '弹药',
  '工具', '蜡', '绳', '装备', '墨水',
] as const;

export function getResourceMap(r: Resources): Record<string, number> {
  return {
    钱: r.钱, 食物: r.食物, 淡水: r.淡水, 火药: r.火药, 弹药: r.弹药,
    工具: r.工具, 蜡: r.蜡, 绳: r.绳, 装备: r.装备, 墨水: r.墨水,
  };
}

export function checkConditionWithManagers(
  condition: Condition | undefined,
  flagMgr: FlagManager,
  stateMgr: StateManager,
  providence: ProvidenceEngine,
): boolean {
  if (!condition) return true;
  return flagMgr.checkCondition(
    condition,
    () => stateMgr.getState() as unknown as Record<string, number>,
    () => getResourceMap(stateMgr.getResources()),
    () => stateMgr.getSkills() as unknown as Record<string, number>,
    () => providence.getValue(),
  );
}

const CN_MONTHS = ['正','二','三','四','五','六','七','八','九','十','十一','十二'];

export function formatChineseDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}年${CN_MONTHS[m - 1]}月${d}日`;
}

export function cnNumber(n: number): string {
  const digits = ['零','一','二','三','四','五','六','七','八','九','十'];
  if (n <= 10) return digits[n];
  if (n < 20) return '十' + digits[n - 10];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return digits[tens] + '十' + (ones > 0 ? digits[ones] : '');
  }
  return String(n);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
