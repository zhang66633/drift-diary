# 章节数据编写规则

本文档约束 `src/data/chapters/ch*.json` 的编写规范。所有新增/修改章节数据必须遵守以下规则，CI 会通过 `scripts/validate-schema.mjs` 做 Zod 校验。

## 条件文本

text 数组中的条件文本**必须**使用 `segments` 包裹格式：

```json
{
  "segments": [
    { "text": "条件A的文本", "condition": { "type": "flag", "target": "x", "operator": "eq", "value": "a" } },
    { "text": "条件B的文本", "condition": { "type": "flag", "target": "x", "operator": "eq", "value": "b" } }
  ]
}
```

禁止将裸 TextSegment 直接放入 text 数组：

```json
// 错误写法
{ "text": "xxx", "condition": { ... } }
```

## 时间推进

使用 `type: "time"` + `operation: "add"` + 数值天数：

```json
{ "type": "time", "operation": "add", "value": 1 }
```

跳转到具体日期用 `operation: "set"` + 字符串：

```json
{ "type": "time", "operation": "set", "value": "1659-10-01" }
```

禁止使用 `"operation": "advanceDays"`——该值不在 Schema 枚举内，引擎不会处理。

## 天意钩子 (providenceHook)

低天意和高天意的效果**必须**分开写在 `lowEffects` / `highEffects` 中：

```json
"providenceHook": {
  "lowThreshold": 35,
  "highThreshold": 65,
  "lowEffects": [
    { "type": "state", "target": "士气", "value": -10, "operation": "add" }
  ],
  "highEffects": [
    { "type": "state", "target": "士气", "value": 10, "operation": "add" }
  ]
}
```

禁止将两组效果混放在同一个 `effects` 数组里并用 `checkHook` 字段区分——引擎不识别 `checkHook`，会导致所有效果同时执行、互相抵消。

## 选项 (choices)

每个 choice **必须**包含 `consequences` 数组，即使没有实际效果也要写空数组：

```json
{ "id": "xxx", "text": "xxx", "consequences": [], "nextScene": "xxx" }
```

## 章节标记

- `chapterStart: true` 只出现在每章第一个场景
- `chapterEnd: true` 只出现在每章最后一个场景（不要重复标记）

## onEnter

只在有实际效果时写 `onEnter`，不要写空数组 `"onEnter": []`。

## 场景 ID 命名

格式：`ch{章号}_{序号}_{中文关键词}`，如 `ch3_5_勘察`。

## 验证

修改章节数据后运行：

```bash
node scripts/validate-schema.mjs   # Zod Schema 校验（三章）
node scripts/validate-scenes.mjs   # 场景跳转完整性
npx tsc --noEmit                   # TypeScript 类型检查
```
