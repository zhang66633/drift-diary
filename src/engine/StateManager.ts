import type { PlayerState, Resources, Skills, Companion, SkillId } from '../types/state';

const STATE_KEYS: (keyof PlayerState)[] = ['良心', '天意', '勇气', '士气', '健康'];
const RESOURCE_KEYS = [
  '钱', '食物', '淡水', '火药', '弹药', '工具', '蜡', '绳', '装备', '墨水',
] as const;

export class StateManager {
  private state: PlayerState;
  private resources: Resources;
  private skills: Skills;

  constructor(
    initialState: PlayerState,
    initialResources: Resources,
    initialSkills: Skills,
  ) {
    this.state = { ...initialState };
    this.resources = { ...initialResources, 同伴: [...initialResources.同伴] };
    this.skills = { ...initialSkills };
  }

  getState(): Readonly<PlayerState> {
    return this.state;
  }

  getResources(): Readonly<Resources> {
    return this.resources;
  }

  getSkills(): Readonly<Skills> {
    return this.skills;
  }

  modifyState(target: keyof PlayerState, delta: number): void {
    if (!(target in this.state)) return;
    const next = this.state[target] + delta;
    this.state[target] = this.clamp(next, 0, 100);
  }

  setState(target: keyof PlayerState, value: number): void {
    if (!(target in this.state)) return;
    this.state[target] = this.clamp(value, 0, 100);
  }

  modifyResource(target: keyof Resources, delta: number): void {
    if (target === '同伴') return;
    if (!(target in this.resources)) return;
    const next = (this.resources[target] as number) + delta;
    (this.resources as unknown as Record<string, number>)[target as string] = Math.max(0, next);
  }

  setResource(target: keyof Resources, value: number): void {
    if (target === '同伴') return;
    if (!(target in this.resources)) return;
    (this.resources as unknown as Record<string, number>)[target as string] = Math.max(0, value);
  }

  modifySkill(target: SkillId, delta: number): void {
    if (!(target in this.skills)) return;
    const next = this.skills[target] + delta;
    this.skills[target] = this.clamp(next, 0, 5);
  }

  setSkill(target: SkillId, value: number): void {
    if (!(target in this.skills)) return;
    this.skills[target] = this.clamp(value, 0, 5);
  }

  addCompanion(companion: Companion): void {
    if (this.resources.同伴.find(c => c.id === companion.id)) return;
    this.resources.同伴.push({ ...companion });
  }

  removeCompanion(id: string): void {
    this.resources.同伴 = this.resources.同伴.filter(c => c.id !== id);
  }

  modifyCompanionLoyalty(id: string, delta: number): void {
    const c = this.resources.同伴.find(c => c.id === id);
    if (!c) return;
    c.loyalty = this.clamp(c.loyalty + delta, 0, 100);
  }

  reset(state: PlayerState, resources: Resources, skills: Skills): void {
    this.state = { ...state };
    this.resources = { ...resources, 同伴: [...resources.同伴] };
    this.skills = { ...skills };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export { STATE_KEYS, RESOURCE_KEYS };
