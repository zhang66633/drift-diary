import { z } from 'zod';

// 条件值: string | number | boolean | string[]
const FlagValueSchema = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]);
// 导出供外部使用
export { FlagValueSchema };

const ConditionSchema: z.ZodType<any> = z.lazy(() => z.object({
  and: z.array(ConditionSchema).optional(),
  or: z.array(ConditionSchema).optional(),
  type: z.enum(['flag', 'state', 'resource', 'skill', 'providence']).optional(),
  target: z.string().optional(),
  operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in']).optional(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
}));

const ConsequenceSchema = z.object({
  type: z.enum(['state', 'resource', 'skill', 'flag', 'time', 'companion', 'providence', 'event']),
  target: z.string().optional(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  operation: z.enum(['set', 'add', 'push', 'remove']).optional(),
  condition: ConditionSchema.optional(),
  scaleByProvidence: z.object({
    worst: z.number(),
    best: z.number(),
  }).optional(),
});

const TextSegmentSchema = z.object({
  text: z.string(),
  condition: ConditionSchema.optional(),
});

const ConditionalTextSchema = z.object({
  segments: z.array(TextSegmentSchema),
});

const NarrationSpecSchema = z.object({
  text: z.union([z.string(), ConditionalTextSchema]),
  trigger: z.enum(['on_choice', 'on_enter', 'on_exit']),
  condition: ConditionSchema.optional(),
});

const DreamSpecSchema = z.object({
  text: z.union([z.string(), ConditionalTextSchema]),
  trigger: z.enum(['on_choice', 'on_enter']),
});

const DeathSpecSchema = z.object({
  text: z.string(),
  reviveScene: z.string().optional(),
});

const EndingSpecSchema = z.object({
  title: z.string(),
  text: z.string(),
  buttonText: z.string().optional(),
});

const SenseTagSchema = z.object({
  sense: z.enum(['视', '听', '触', '嗅', '温']),
  text: z.string(),
});

const ProvidenceHookSchema = z.object({
  lowThreshold: z.number().optional(),
  highThreshold: z.number().optional(),
  effects: z.array(ConsequenceSchema).optional(),
  lowEffects: z.array(ConsequenceSchema).optional(),
  highEffects: z.array(ConsequenceSchema).optional(),
});

const IllustrationSpecSchema = z.object({
  prompt: z.string(),
  alt: z.string(),
  size: z.enum(['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9']),
  position: z.enum(['top', 'inline', 'fullpage']),
  cached: z.string().optional(),
});

const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCanon: z.boolean().optional(),
  condition: ConditionSchema.optional(),
  requirement: ConditionSchema.optional(),
  requireFailText: z.string().optional(),
  consequences: z.array(ConsequenceSchema),
  nextScene: z.string().optional(),
  narration: NarrationSpecSchema.optional(),
  death: DeathSpecSchema.optional(),
});

const MultiChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  consequences: z.array(ConsequenceSchema),
  condition: ConditionSchema.optional(),
});

const MultiChoiceSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  minSelect: z.number().optional(),
  maxSelect: z.number().optional(),
  options: z.array(MultiChoiceOptionSchema),
  confirmText: z.string(),
  nextScene: z.string(),
  narration: NarrationSpecSchema.optional(),
});

export const SceneSchema = z.object({
  id: z.string(),
  chapter: z.number().int().positive(),
  beat: z.string(),
  date: z.string().optional(),
  text: z.array(z.union([z.string(), ConditionalTextSchema])),
  quotation: z.string().optional(),
  senses: z.array(SenseTagSchema).optional(),
  illustration: IllustrationSpecSchema.optional(),
  audio: z.object({
    ambient: z.string().optional(),
    sfx: z.string().optional(),
  }).optional(),
  choices: z.array(ChoiceSchema).optional(),
  multiChoice: MultiChoiceSchema.optional(),
  narration: NarrationSpecSchema.optional(),
  dream: DreamSpecSchema.optional(),
  ending: EndingSpecSchema.optional(),
  providenceHook: ProvidenceHookSchema.optional(),
  onEnter: z.array(ConsequenceSchema).optional(),
  chapterStart: z.boolean().optional(),
  chapterEnd: z.boolean().optional(),
}).refine(
  data => {
    if (data.ending) return true;
    return (data.choices !== undefined) !== (data.multiChoice !== undefined);
  },
  { message: 'Scene must have exactly one of: choices, multiChoice, or ending', path: ['choices'] }
);

export const ChapterSchema = z.object({
  chapter: z.number().int().positive(),
  title: z.string(),
  quotation: z.string(),
  scenes: z.array(SceneSchema),
});

export type ValidatedScene = z.infer<typeof SceneSchema>;
export type ValidatedChapter = z.infer<typeof ChapterSchema>;

export function validateChapter(data: unknown): ValidatedChapter {
  return ChapterSchema.parse(data);
}

export function validateScene(data: unknown): ValidatedScene {
  return SceneSchema.parse(data);
}
