import type { Consequence, ConditionalText, TextSegment } from '../types/scene';
import type { Companion, PlayerState, Resources, SkillId } from '../types/state';
import type { StateManager } from './StateManager';
import type { FlagManager } from './FlagManager';
import type { TimeManager } from './TimeManager';
import type { ProvidenceEngine } from './ProvidenceEngine';
import { getResourceMap } from '../utils/helpers';

export type EventCallback = (eventName: string, value?: unknown) => void;

export class ConsequenceEngine {
  private stateMgr: StateManager;
  private flagMgr: FlagManager;
  private timeMgr: TimeManager;
  private providence: ProvidenceEngine;
  private onEvent?: EventCallback;

  constructor(deps: {
    stateManager: StateManager;
    flagManager: FlagManager;
    timeManager: TimeManager;
    providenceEngine: ProvidenceEngine;
    onEvent?: EventCallback;
  }) {
    this.stateMgr = deps.stateManager;
    this.flagMgr = deps.flagManager;
    this.timeMgr = deps.timeManager;
    this.providence = deps.providenceEngine;
    this.onEvent = deps.onEvent;
  }

  execute(consequences: Consequence[] | undefined): void {
    if (!consequences) return;
    for (const c of consequences) {
      this.executeOne(c);
    }
  }

  private checkCondition(condition: Consequence['condition']): boolean {
    if (!condition) return true;
    return this.flagMgr.checkCondition(
      condition,
      () => this.stateMgr.getState() as unknown as Record<string, number>,
      () => getResourceMap(this.stateMgr.getResources()),
      () => this.stateMgr.getSkills() as unknown as Record<string, number>,
      () => this.providence.getValue(),
    );
  }

  private executeOne(c: Consequence): void {
    if (!this.checkCondition(c.condition)) return;

    const val = c.value as number | undefined;
    const op = c.operation ?? 'set';
    const target = c.target;

    switch (c.type) {
      case 'state': {
        if (!target || val === undefined) return;
        const key = target as keyof PlayerState;
        if (op === 'add') this.stateMgr.modifyState(key, val);
        else this.stateMgr.setState(key, val);
        break;
      }
      case 'resource': {
        if (!target || val === undefined) return;
        const key = target as keyof Resources;
        if (op === 'add') this.stateMgr.modifyResource(key, val);
        else this.stateMgr.setResource(key, val);
        break;
      }
      case 'skill': {
        if (!target || val === undefined) return;
        const key = target as SkillId;
        if (op === 'add') this.stateMgr.modifySkill(key, val);
        else this.stateMgr.setSkill(key, val);
        break;
      }
      case 'flag': {
        if (!target || c.value === undefined) return;
        if (op === 'push' && typeof c.value === 'string') {
          this.flagMgr.pushFlag(target, c.value);
        } else if (op === 'remove') {
          this.flagMgr.removeFlag(target);
        } else {
          this.flagMgr.setFlag(target, c.value);
        }
        break;
      }
      case 'time': {
        if (typeof val === 'number' && op === 'add') {
          this.timeMgr.advanceDays(val);
        } else if (typeof c.value === 'string' && (op === 'set' || op === undefined)) {
          this.timeMgr.advanceTo(c.value);
        }
        break;
      }
      case 'companion': {
        if (!target) return;
        if (op === 'remove' || c.value === false) {
          this.stateMgr.removeCompanion(target);
        } else if (op === 'add' && typeof c.value === 'object' && c.value !== null && !Array.isArray(c.value)) {
          this.stateMgr.addCompanion(c.value as Companion);
        } else if (c.value === true || op === 'set') {
          if (!this.stateMgr.getResources().同伴.find(c => c.id === target)) {
            this.stateMgr.addCompanion({ id: target, name: target, loyalty: 100 });
          }
        } else if (typeof val === 'number') {
          this.stateMgr.modifyCompanionLoyalty(target, val);
        }
        break;
      }
      case 'providence': {
        if (val === undefined) return;
        if (op === 'add') this.providence.modify(val);
        else this.providence.setValue(val);
        break;
      }
      case 'event': {
        if (this.onEvent && target) {
          this.onEvent(target, c.value);
        }
        break;
      }
    }
  }

  resolveText(text: string | ConditionalText | undefined): string {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text.segments
      .filter(seg => this.segmentSatisfied(seg))
      .map(seg => seg.text)
      .join('');
  }

  private segmentSatisfied(seg: TextSegment): boolean {
    return this.checkCondition(seg.condition);
  }
}
