import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadChapter(num) {
  const path = join(__dirname, `../src/data/chapters/ch${num}.json`);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function getTextLength(text) {
  if (typeof text === 'string') return text.length;
  if (text && text.segments) {
    return text.segments.reduce((sum, seg) => sum + (seg.text?.length || 0), 0);
  }
  return 0;
}

function getFlagFromCondition(cond, flagsSet) {
  if (!cond) return;
  if (cond.target) flagsSet.add(cond.target);
}

function collectFlagsFromText(text, flagsSet) {
  if (typeof text === 'string') return;
  if (text && text.segments) {
    for (const seg of text.segments) {
      if (seg.condition) getFlagFromCondition(seg.condition, flagsSet);
    }
  }
}

function collectFlagsFromNarration(narration, flagsSet) {
  if (!narration) return;
  collectFlagsFromText(narration.text, flagsSet);
}

function collectFlagsFromChoice(choice, flagsSet) {
  if (choice.condition) getFlagFromCondition(choice.condition, flagsSet);
  if (choice.consequences) {
    for (const c of choice.consequences) {
      if (c.type === 'flag' && c.target) flagsSet.add(c.target);
    }
  }
  if (choice.narration) collectFlagsFromNarration(choice.narration, flagsSet);
}

function reviewContent() {
  const errors = [];
  const warnings = [];
  const infos = [];

  const allSceneIds = new Set();
  const chapters = [];
  const flagUsage = {};

  for (let i = 1; i <= 3; i++) {
    try {
      const ch = loadChapter(i);
      chapters.push(ch);
      for (const scene of ch.scenes) {
        allSceneIds.add(scene.id);
      }
    } catch (e) {
      if (i <= 2) {
        errors.push(`加载第${i}章失败: ${e.message}`);
      }
    }
  }

  console.log('\n=== 内容规范审查 ===\n');

  for (const ch of chapters) {
    console.log(`第${ch.chapter}章「${ch.title}」: ${ch.scenes.length} 个场景`);

    for (const scene of ch.scenes) {
      const flagsInScene = new Set();

      if (scene.narration) {
        collectFlagsFromNarration(scene.narration, flagsInScene);
      }
      if (scene.dream) {
        collectFlagsFromText(scene.dream.text, flagsInScene);
      }
      if (scene.choices) {
        for (const choice of scene.choices) {
          collectFlagsFromChoice(choice, flagsInScene);
        }
      }
      if (scene.text) {
        for (const t of scene.text) {
          collectFlagsFromText(t, flagsInScene);
        }
      }

      for (const flag of flagsInScene) {
        if (!flagUsage[flag]) flagUsage[flag] = [];
        flagUsage[flag].push(scene.id);
      }

      if (scene.ending) {
        if (!scene.text || !Array.isArray(scene.text) || scene.text.length !== 0) {
          errors.push(`[${scene.id}] 结局场景text必须为空数组`);
        }
        continue;
      }

      if (scene.choices && scene.choices.length === 1) {
        const choice = scene.choices[0];
        const hasEffect = (choice.consequences && choice.consequences.length > 0) ||
          choice.narration || choice.dream || choice.death;
        if (!hasEffect) {
          warnings.push(`[${scene.id}] 单选项且无任何效果（违反R-012）`);
        }
      }

      if (scene.choices && scene.choices.length >= 2) {
        const nextScenes = new Set();
        for (const choice of scene.choices) {
          if (choice.nextScene) nextScenes.add(choice.nextScene);
        }
        if (nextScenes.size === 1 && !scene.choices.some(c => c.condition)) {
          warnings.push(`[${scene.id}] 所有选项跳转到同一目标且无条件区分（可能违反R-012）`);
        }
      }

      if (scene.dream && scene.dream.trigger === 'on_enter') {
        const dreamLen = getTextLength(scene.dream.text);
        if (dreamLen > 300) {
          warnings.push(`[${scene.id}] 梦境文本${dreamLen}字，超过300字阈值（梦境承担了过多剧情功能）`);
        }
      }

      if (scene.choices) {
        for (const choice of scene.choices) {
          if (choice.nextScene && !allSceneIds.has(choice.nextScene)) {
            errors.push(`[${scene.id}] 选项[${choice.id}] 跳转到不存在的场景: ${choice.nextScene}`);
          }
        }
      }
    }
  }

  console.log('\n--- Flag使用统计 ---\n');
  const flagNames = Object.keys(flagUsage).sort();
  for (const flag of flagNames) {
    const count = flagUsage[flag].length;
    const scenes = flagUsage[flag].join(', ');
    const status = count >= 3 ? '✅' : count >= 2 ? '⚠️' : '❌';
    console.log(`  ${status} ${flag}: ${count} 处 (${scenes})`);
    if (count < 3) {
      warnings.push(`Flag「${flag}」仅出现${count}处，不足R-019要求的至少3处`);
    }
  }

  console.log(`\n总场景数: ${allSceneIds.size}`);
  console.log(`总Flag数: ${flagNames.length}`);

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} 个错误:`);
    errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log(`\n✅ 无错误`);
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} 个警告:`);
    warnings.forEach(w => console.log(`  - ${w}`));
  } else {
    console.log(`\n✅ 无警告`);
  }

  console.log('\n=== 审查完成 ===\n');
  return errors.length === 0;
}

reviewContent();
