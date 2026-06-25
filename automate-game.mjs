import { chromium } from 'playwright';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to game...');
  
  // Try 5175 first, fall back to 5176
  let port = 5175;
  try {
    await page.goto('http://localhost:5175/', { timeout: 5000, waitUntil: 'domcontentloaded' });
    console.log('Connected to port 5175');
  } catch (e) {
    console.log('Port 5175 not available, trying 5176...');
    await page.goto('http://localhost:5176/', { timeout: 10000, waitUntil: 'domcontentloaded' });
    port = 5176;
    console.log('Connected to port 5176');
  }

  await sleep(1500);

  // Click "翻开新的一页" (Start new game)
  console.log('Clicking "翻开新的一页"...');
  await page.getByText('翻开新的一页').click();
  await sleep(500);

  // Helper: press Enter/space to continue
  const pressContinue = async (times = 1) => {
    for (let i = 0; i < times; i++) {
      await page.keyboard.press('Enter');
      await sleep(80);
    }
  };

  // Click anywhere on screen/overlay to dismiss it
  const clickCenter = async () => {
    await page.mouse.click(640, 400);
    await sleep(100);
  };

  // Wait for choices to appear by checking for actual choice buttons (not menu)
  const waitForChoices = async (maxWait = 5000) => {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = (await btn.textContent())?.trim();
        if (text && text.length > 4) {
          // Check if it's a game choice (not menu items)
          const menuItems = ['翻开新的一页', '继续阅读', '读取其他存档…', '回忆录', '保存进度', '读取进度', '设置', '返回主菜单', '关闭菜单', '合上书本'];
          if (!menuItems.some(m => text.includes(m))) {
            return true;
          }
        }
      }
      // Try pressing Enter or clicking to advance text
      await pressContinue(1);
      await sleep(100);
    }
    return false;
  };

  // Select first valid non-death choice
  const selectChoice = async (predicate = null) => {
    await waitForChoices();
    
    const buttons = await page.$$('button');
    const menuItems = ['翻开新的一页', '继续阅读', '读取其他存档…', '回忆录', '保存进度', '读取进度', '设置', '返回主菜单', '关闭菜单', '合上书本'];
    
    for (const btn of buttons) {
      const text = (await btn.textContent())?.trim();
      if (!text) continue;
      
      // Skip menu items
      if (menuItems.some(m => text.includes(m))) continue;
      
      // Skip death option
      if (text.includes('死战到底') || text.includes('宁死不屈')) {
        console.log(`  Skipping death option: "${text}"`);
        continue;
      }
      
      // If predicate provided, use it
      if (predicate) {
        if (predicate(text)) {
          console.log(`  Selecting: "${text}"`);
          await btn.click();
          await sleep(300);
          return text;
        }
      } else if (text.length > 3) {
        console.log(`  Selecting: "${text}"`);
        await btn.click();
        await sleep(300);
        return text;
      }
    }
    
    // Fallback: press Enter
    console.log('  No button found, pressing Enter...');
    await pressContinue(3);
    return null;
  };

  // === CHAPTER 1 ===
  console.log('\n=== Chapter 1: 出走与初航 ===');
  
  // ch1_1 父训
  console.log('[1/8] ch1_1_父训');
  await selectChoice();
  await pressContinue(5);
  
  // ch1_2 母亲
  console.log('[2/8] ch1_2_母亲');
  await selectChoice();
  await pressContinue(5);
  
  // ch1_3 赫尔
  console.log('[3/8] ch1_3_赫尔');
  await selectChoice();
  await pressContinue(5);
  
  // ch1_4 出海
  console.log('[4/8] ch1_4_出海');
  await selectChoice();
  await pressContinue(5);
  
  // ch1_5 风暴
  console.log('[5/8] ch1_5_风暴');
  await selectChoice();
  await pressContinue(5);
  
  // ch1_6 抽水
  console.log('[6/8] ch1_6_抽水');
  await selectChoice();
  await pressContinue(5);
  
  // ch1_7 弃船
  console.log('[7/8] ch1_7_弃船');
  await selectChoice();
  await pressContinue(5);
  
  // ch1_8 岸上 - need to choose path to ch2 (NOT "回家" which is ending)
  console.log('[8/8] ch1_8_岸上 (choosing ch2 path)');
  // Choose "羞耻心作祟，没脸回家，继续去伦敦" (second choice, canon path)
  await waitForChoices();
  await selectChoice(text => text.includes('羞耻心') || text.includes('没脸回家'));
  await pressContinue(10);
  await sleep(500);

  // === CHAPTER 2 ===
  console.log('\n=== Chapter 2: 奴役与逃亡 ===');
  
  // ch2_1 几内亚
  console.log('[1/3] ch2_1_几内亚');
  await selectChoice();
  await pressContinue(5);
  
  // ch2_2 被俘 - critical: choose non-death option
  console.log('[2/3] ch2_2_被俘 (avoiding death branch)');
  await waitForChoices();
  // Choose "冲到前面奋力战斗" (first non-death option) or "见势不妙"
  await selectChoice(text => text.includes('冲到前面奋力战斗'));
  await pressContinue(10);
  await sleep(800);

  // Now should be at ch2_3_为奴 - wait for it to load
  console.log('[3/3] Reaching ch2_3_为奴...');
  
  // Press through any narration until we see choices or text about being slave
  let arrived = false;
  for (let i = 0; i < 30; i++) {
    const content = await page.content();
    if (content.includes('萨里当了两年奴隶') || content.includes('ch2_3') || content.includes('为奴')) {
      arrived = true;
      console.log('  Successfully arrived at ch2_3_为奴!');
      break;
    }
    await pressContinue(2);
    await clickCenter();
    await sleep(200);
  }
  
  if (!arrived) {
    console.log('  Warning: may not be at ch2_3 yet, continuing...');
    await pressContinue(10);
  }

  // Dismiss any remaining overlays but DO NOT select any choices at ch2_3
  console.log('\nStopping at ch2_3_为奴 (not making choices here)');
  await sleep(500);
  await pressContinue(5);

  // === OPEN MEMOIR ===
  console.log('\nOpening memoir...');
  
  // Close any open overlays with Escape first
  await page.keyboard.press('Escape');
  await sleep(300);
  
  // Click the hamburger menu button (☰) in top-right corner
  // It's at top-4 right-4 ≈ (1280-16-~24, 16) ≈ (1230, 25)
  console.log('Clicking hamburger menu (☰) at top-right...');
  await page.mouse.click(1240, 28);
  await sleep(600);
  
  // Now click "📖 回忆录"
  console.log('Clicking "回忆录" in menu...');
  const memoirBtn = await page.getByText('回忆录').first();
  if (memoirBtn) {
    await memoirBtn.click();
    console.log('Memoir opened!');
  } else {
    // Try finding the button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = (await btn.textContent())?.trim();
      if (text && text.includes('回忆录')) {
        await btn.click();
        console.log('Memoir opened via iteration!');
        break;
      }
    }
  }
  
  await sleep(1500);

  // Take screenshot
  const screenshotPath = 'D:\\Mid\\demo\\memoir-ch2-branch.png';
  console.log(`Taking screenshot -> ${screenshotPath}`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved successfully!');

  // Keep browser open a moment to verify
  await sleep(2000);

  await browser.close();
  
  console.log('\n=== SUMMARY ===');
  console.log('- Started new game ("翻开新的一页")');
  console.log('- Progressed through all Chapter 1 scenes (8 scenes)');
  console.log('- At ch1_8, chose "羞耻心作祟，没脸回家，继续去伦敦" to reach Chapter 2');
  console.log('- At ch2_1_几内亚, selected first choice');
  console.log('- At ch2_2_被俘, chose "冲到前面奋力战斗" (non-death option)');
  console.log('- Reached ch2_3_为奴 and stopped (did not select choices here)');
  console.log('- Opened hamburger menu (top-right ☰) and clicked 回忆录');
  console.log(`- Screenshot saved to: ${screenshotPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
