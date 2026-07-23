import type { FlagValue } from './state';

export interface AudioSpec {
  ambient?: string;   // 环境音文件名（不含扩展名），对应 public/audio/ambient/
  sfx?: string;       // 进入场景时触发的一次性音效，对应 public/audio/sfx/
  bgm?: string;       // 背景音乐文件名（不含扩展名），对应 public/audio/bgm/
}

// 场景
export interface Scene {
  id: string;
  chapter: number;
  beat: string;
  date?: string;
  text: (string | ConditionalText | TextSegment)[];
  quotation?: string;
  senses?: SenseTag[];
  illustration?: IllustrationSpec;
  audio?: AudioSpec;
  choices?: Choice[];
  multiChoice?: MultiChoice;
  narration?: NarrationSpec;
  dream?: DreamSpec;
  ending?: EndingSpec;
  providenceHook?: ProvidenceHook;
  onEnter?: Consequence[];
  chapterStart?: boolean;
  chapterEnd?: boolean;
}

export interface Choice {
  id: string;
  text: string;
  isCanon?: boolean;
  condition?: Condition;
  requirement?: Condition;
  requireFailText?: string;
  consequences: Consequence[];
  nextScene?: string;
  narration?: NarrationSpec;
  death?: DeathSpec;
}

export interface MultiChoice {
  id: string;
  prompt: string;
  minSelect?: number;
  maxSelect?: number;
  options: MultiChoiceOption[];
  confirmText: string;
  nextScene: string;
  narration?: NarrationSpec;
}

export interface MultiChoiceOption {
  id: string;
  text: string;
  consequences: Consequence[];
  condition?: Condition;
}

export interface DeathSpec {
  text: string;
  reviveScene?: string;
}

export interface Consequence {
  type: ConsequenceType;
  target?: string;
  value?: number | string | boolean | string[];
  operation?: 'set' | 'add' | 'push' | 'remove';
  condition?: Condition;
  /** 天意动态缩放：实际值 = best + (worst - best) × (1 - 天意/100)，量级向上取5的倍数 */
  scaleByProvidence?: {
    worst: number;  // 天意=0 时的效果值
    best: number;   // 天意=100 时的效果值
  };
}

export type ConsequenceType =
  | 'state' | 'resource' | 'skill' | 'flag'
  | 'time' | 'companion' | 'providence' | 'event';

export interface Condition {
  and?: Condition[];
  or?: Condition[];
  type?: 'flag' | 'state' | 'resource' | 'skill' | 'providence';
  target?: string;
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value?: FlagValue | number;
}

export interface ConditionalText {
  segments: TextSegment[];
}
export interface TextSegment {
  text: string;
  condition?: Condition;
}

export interface SenseTag {
  sense: '视' | '听' | '触' | '嗅' | '温';
  text: string;
}

export interface NarrationSpec {
  text: string | ConditionalText;
  trigger: 'on_choice' | 'on_enter' | 'on_exit';
  condition?: Condition;
}

export interface DreamSpec {
  text: string | ConditionalText;
  trigger: 'on_choice' | 'on_enter';
}

export interface EndingSpec {
  title: string;
  text: string;
  buttonText?: string;
  moneyText?: string | ConditionalText;
}

export interface ProvidenceHook {
  lowThreshold?: number;
  highThreshold?: number;
  effects?: Consequence[];
  lowEffects?: Consequence[];
  highEffects?: Consequence[];
}

export interface IllustrationSpec {
  prompt: string;
  alt: string;
  size: IllustrationSize;
  position: 'top' | 'inline' | 'fullpage';
  src?: string;
  cached?: string;
}

export type IllustrationSize =
  | 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9'
  | 'landscape_4_3' | 'landscape_16_9';

// 章节数据
export interface Chapter {
  chapter: number;
  title: string;
  quotation: string;
  scenes: Scene[];
}
