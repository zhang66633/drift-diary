import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadChapter(num) {
  const path = join(__dirname, `../src/data/chapters/ch${num}.json`);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function validateScenes() {
  const errors = [];
  const warnings = [];
  const allSceneIds = new Set();
  const chapters = [];

  for (let i = 1; i <= 3; i++) {
    try {
      const ch = loadChapter(i);
      chapters.push(ch);
      for (const scene of ch.scenes) {
        if (allSceneIds.has(scene.id)) {
          errors.push(`重复场景ID: ${scene.id}`);
        }
        allSceneIds.add(scene.id);
      }
    } catch (e) {
      if (i <= 2) {
        errors.push(`加载第${i}章失败: ${e.message}`);
      } else {
        warnings.push(`第${i}章不存在（Demo可接受）`);
      }
    }
  }

  console.log(`\n=== 场景跳转完整性检查 ===\n`);

  for (const ch of chapters) {
    console.log(`第${ch.chapter}章「${ch.title}」: ${ch.scenes.length} 个场景`);
    
    for (const scene of ch.scenes) {
      if (scene.choices) {
        for (const choice of scene.choices) {
          if (choice.nextScene && !allSceneIds.has(choice.nextScene)) {
            errors.push(`[${scene.id}] 选项[${choice.id}] 跳转到不存在的场景: ${choice.nextScene}`);
          }
        }
      } else if (!scene.ending && !scene.multiChoice) {
        warnings.push(`[${scene.id}] 没有choices/multiChoice/ending，可能是死路`);
      }
    }
  }

  console.log(`\n总场景数: ${allSceneIds.size}`);

  if (errors.length > 0) {
    console.log(`\n❌ 发现 ${errors.length} 个错误:`);
    errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log(`\n✅ 所有场景跳转引用完整！`);
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} 个警告:`);
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  const ch1 = chapters.find(c => c.chapter === 1);
  if (ch1) {
    let allCanonJumpsValid = true;
    for (const scene of ch1.scenes) {
      if (scene.choices) {
        for (const choice of scene.choices) {
          if (choice.nextScene && !choice.nextScene.startsWith('ch1_') && !choice.nextScene.startsWith('ch2_')) {
            errors.push(`[${scene.id}] 选项[${choice.id}] 跳转异常: ${choice.nextScene}`);
            allCanonJumpsValid = false;
          }
        }
      }
    }
    if (allCanonJumpsValid) {
      console.log(`\n✅ 第一章跳转链路验证通过`);
    }
  }

  const ch2 = chapters.find(c => c.chapter === 2);
  const ch2Last = ch2?.scenes[ch2.scenes.length - 1];
  if (ch2Last) {
    console.log(`\n第二章结尾: ${ch2Last.id}`);
    console.log(`  最后文本预览: ${ch2Last.text[ch2Last.text.length - 1]?.slice(0, 80)}...`);
  }

  console.log(`\n=== 检查完成 ===\n`);
  return errors.length === 0;
}

validateScenes();
