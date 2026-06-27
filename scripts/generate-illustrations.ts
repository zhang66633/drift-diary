/**
 * scripts/generate-illustrations.ts
 *
 * 批量生成 AI 插图脚本。
 * 扫描所有章节 JSON，为有 illustration.prompt 但无 illustration.cached 的场景
 * 调用火山引擎 Seedream API 生成图像，将 base64 数据写回 cached 字段。
 *
 * 使用方法：
 *   ./node_modules/.bin/tsx scripts/generate-illustrations.ts
 *
 * 环境变量（可选，优先从 .env 文件读取）：
 *   ARK_API_KEY — 火山引擎 Ark API Key
 *
 * 选项（通过命令行参数）：
 *   --dry-run      仅显示将要生成的场景，不实际调用 API
 *   --scene <id>   仅生成指定场景（可重复使用）
 *   --force        重新生成已有 cached 的场景
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ArkRuntimeClient } from '@volcengine/ark-runtime';

// ESM __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载 .env 文件（无第三方依赖）
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// ── 配置 ──

const MODEL = 'doubao-seedream-4-5-251128';
const CHAPTERS_DIR = path.resolve(__dirname, '../src/data/chapters');
const CHAPTER_FILES = ['ch1.json', 'ch2.json'];

// Seedream 5.0 最低要求 3,686,400 像素（1920×1920）
const SIZE_MAP: Record<string, string> = {
  square_hd: '2048x2048',
  square: '1920x1920',
  portrait_4_3: '1920x2560',
  portrait_16_9: '1920x3360',
  landscape_4_3: '2560x1920',
  landscape_16_9: '2560x1440',
};

interface IllustrationSpec {
  prompt: string;
  alt: string;
  size: string;
  position: 'top' | 'inline' | 'fullpage';
  cached?: string;
}

interface Scene {
  id: string;
  illustration?: IllustrationSpec;
  [key: string]: unknown;
}

interface Chapter {
  chapter: number;
  title: string;
  scenes: Scene[];
}

// ── CLI 参数解析 ──

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const targetScenes: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--scene' && args[i + 1]) {
    targetScenes.push(args[i + 1]);
    i++;
  }
}

// ── 日志工具 ──

function log(msg: string): void {
  process.stdout.write(`[illustration] ${msg}\n`);
}

function logError(msg: string): void {
  process.stderr.write(`[illustration:error] ${msg}\n`);
}

// ── 主流程 ──

async function main(): Promise<void> {
  // 收集待生成的场景
  interface Task {
    chapterPath: string;
    chapter: Chapter;
    sceneIndex: number;
    scene: Scene;
    spec: IllustrationSpec;
  }

  const tasks: Task[] = [];

  for (const file of CHAPTER_FILES) {
    const filePath = path.join(CHAPTERS_DIR, file);
    if (!fs.existsSync(filePath)) {
      logError(`Chapter file not found: ${filePath}`);
      continue;
    }

    const chapter: Chapter = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (let i = 0; i < chapter.scenes.length; i++) {
      const scene = chapter.scenes[i];
      if (!scene.illustration) continue;

      // 跳过已缓存的（除非 --force）
      if (scene.illustration.cached && !isForce) continue;

      // 如果指定了目标场景，跳过其他
      if (targetScenes.length > 0 && !targetScenes.includes(scene.id)) continue;

      tasks.push({
        chapterPath: filePath,
        chapter,
        sceneIndex: i,
        scene,
        spec: scene.illustration,
      });
    }
  }

  if (tasks.length === 0) {
    log('No illustrations need to be generated. All scenes are cached.');
    return;
  }

  log(`Found ${tasks.length} scene(s) to generate:`);
  for (const t of tasks) {
    log(`  ${t.scene.id} — ${t.spec.size} [${t.spec.position}] — "${t.spec.prompt.slice(0, 60)}..."`);
  }

  if (isDryRun) {
    log('\nDry run complete. Use without --dry-run to actually generate images.');
    return;
  }

  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    logError('ARK_API_KEY environment variable is required.');
    logError('  Usage: ARK_API_KEY=ark-xxx npx tsx scripts/generate-illustrations.ts');
    process.exit(1);
  }

  // 创建客户端
  const client = ArkRuntimeClient.withApiKey(apiKey, { timeout: 120000 });

  let success = 0;
  let failed = 0;

  for (const t of tasks) {
    const sizeStr = SIZE_MAP[t.spec.size] || '768x1024';
    log(`\nGenerating: ${t.scene.id} (${sizeStr})...`);

    try {
      const response = await client.generateImages({
        model: MODEL,
        prompt: t.spec.prompt,
        size: sizeStr,
        response_format: 'b64_json',
        watermark: false,
        optimize_prompt: true,
      });

      if (response.error) {
        throw new Error(`${response.error.code}: ${response.error.message}`);
      }

      const image = response.data[0];
      if (!image || !image.b64_json) {
        throw new Error('No image data in response');
      }

      // 写回 cached 字段
      t.scene.illustration!.cached = image.b64_json;

      // 写回 JSON 文件
      fs.writeFileSync(t.chapterPath, JSON.stringify(t.chapter, null, 2) + '\n', 'utf-8');

      success++;
      log(`  ✓ Generated successfully (${(image.b64_json.length / 1024).toFixed(0)} KB base64)`);
    } catch (err: unknown) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      logError(`  ✗ Failed: ${t.scene.id} — ${msg}`);
    }

    // 速率限制：API 调用间隔 1 秒
    if (tasks.indexOf(t) < tasks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 汇总
  log(`\n──────────────────────────`);
  log(`Done. Success: ${success}, Failed: ${failed}, Total: ${tasks.length}`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  logError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
