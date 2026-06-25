// 玩家状态轴
export interface PlayerState {
  良心: number;      // 0-100
  天意: number;      // 0-100，隐藏数值（UI 不显示）
  勇气: number;      // 0-100
  士气: number;      // 0-100
  健康: number;      // 0-100
  信念: number;      // 0-100
}

// 资源轴
export interface Resources {
  钱: number;
  食物: number;
  淡水: number;
  火药: number;
  弹药: number;
  工具: number;
  蜡: number;
  绳: number;
  装备: number;
  墨水: number;      // 上岛后启用，demo 留 0
  同伴: Companion[];
}

export interface Companion {
  id: string;
  name: string;
  loyalty: number;
}

export type SkillId = '航海' | '木工' | '种植' | '狩猎' | '语言' | '贸易';
export type Skills = Record<SkillId, number>;

export type FlagValue = string | number | boolean | string[];
export type Flags = Record<string, FlagValue>;

export interface GameTime {
  date: string;
  season: Season;
}
export type Season = '旱季' | '雨季';

// 完整游戏状态
export interface GameState {
  state: PlayerState;
  resources: Resources;
  skills: Skills;
  flags: Flags;
  time: GameTime;
  currentSceneId: string;
  history: string[];
  historySnapshots: SceneSnapshot[];
}

// 场景快照（历史回看，只读）
export interface SceneSnapshot {
  sceneId: string;
  chapter: number;
  beat: string;
  title?: string;
  date?: string;
  text: string[];
  quotation?: string;
  illustrationCached?: string;
  choiceText?: string;
  timestamp: number;
}

// 初始状态
export function createInitialState(): GameState {
  return {
    state: { 良心: 50, 天意: 50, 勇气: 50, 士气: 50, 健康: 100, 信念: 30 },
    resources: {
      钱: 0, 食物: 0, 淡水: 0, 火药: 0, 弹药: 0,
      工具: 0, 蜡: 0, 绳: 0, 装备: 0, 墨水: 0, 同伴: [],
    },
    skills: { 航海: 0, 木工: 0, 种植: 0, 狩猎: 0, 语言: 0, 贸易: 0 },
    flags: {},
    time: { date: '1632-01-01', season: '旱季' },
    currentSceneId: '',
    history: [],
    historySnapshots: [],
  };
}
