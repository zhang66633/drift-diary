import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function validateWithZod() {
  console.log('\n=== Zod Schema 验证 ===\n');
  
  const { ChapterSchema } = await import('../src/engine/schema.ts');
  
  let hasError = false;
  
  for (let chNum = 1; chNum <= 2; chNum++) {
    const path = join(__dirname, `../src/data/chapters/ch${chNum}.json`);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    
    try {
      const result = ChapterSchema.parse(data);
      console.log(`✅ 第${chNum}章「${result.title}」Schema验证通过 - ${result.scenes.length} 场景`);
    } catch (e) {
      hasError = true;
      console.log(`❌ 第${chNum}章 Schema验证失败:`);
      console.log(e.errors || e.message);
    }
  }
  
  console.log(`\n=== 验证${hasError ? '有错误' : '全部通过'} ===\n`);
  process.exit(hasError ? 1 : 0);
}

validateWithZod().catch(e => {
  console.error('验证脚本执行失败:', e);
  process.exit(1);
});
