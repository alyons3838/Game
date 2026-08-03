/**
 * End-to-end smoke test.
 *
 * Plays a complete run in a real browser at three form factors, using only the
 * keyboard for the middle stretch so the TV/D-pad path is exercised rather than
 * assumed. Two bugs that unit tests could not have caught were found this way:
 * focus landing on the sticky header instead of the story choices, and focusing
 * a choice scrolling the unread text off the top of the screen.
 *
 * Usage:
 *   npm run build && npx vite preview --port 4173 &
 *   npm run smoke
 */

import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4173';
const OUT = process.env.SMOKE_OUT ?? './.smoke';
mkdirSync(OUT, { recursive: true });

const errors = [];

async function run(label, contextOptions, shots) {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${label}] console: ${m.text()}`);
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });

  // --- Menu ---
  await page.waitForSelector('h1');
  console.log(`[${label}] title:`, await page.textContent('h1'));
  if (shots) await page.screenshot({ path: `${OUT}/${label}-1-menu.png`, fullPage: true });

  // --- Creation ---
  await page.click('text=New game');
  await page.waitForSelector('#f-name');
  await page.fill('#f-name', 'Ines Marchetti');
  await page.fill('#f-age', '41');
  await page.click('text=she / her');
  await page.fill('#f-profession', 'emergency room nurse');
  await page.fill(
    '#f-definingMoment',
    'I stayed for a double shift and a man lived who would not have. I never told anyone about it.',
  );
  await page.fill('#f-whatLost', 'I lost my sister Nadia, who was three hours away and told me to stay put.');
  await page.fill('#f-immunityTheory', 'I had every vaccine going. It is the only thing that makes sense.');
  if (shots) await page.screenshot({ path: `${OUT}/${label}-2-creation.png`, fullPage: true });

  await page.click('button:has-text("Begin")');
  await page.waitForSelector('.choices .choice', { timeout: 10000 });

  const statusbar = await page.textContent('.statusbar');
  console.log(`[${label}] statusbar:`, statusbar.replace(/\s+/g, ' ').trim());
  if (shots) await page.screenshot({ path: `${OUT}/${label}-3-opening.png`, fullPage: true });

  // --- Play a stretch using ONLY the keyboard, to exercise the D-pad path ---
  const dayAtStart = Number((await page.textContent('.statusbar')).match(/Day (\d+)/)[1]);
  let steps = 0;
  let sawEcho = false;
  let sawOutcomes = false;
  let sawLocked = false;

  for (; steps < 30; steps++) {
    if (await page.locator('.ending').count()) break;

    if (await page.locator('.echo').count()) sawEcho = true;
    if (await page.locator('.outcomes').count()) sawOutcomes = true;
    if (await page.locator('.choice:disabled').count()) sawLocked = true;

    // Keyboard only: focus should already be on a story choice.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(40);
  }

  const dayNow = Number((await page.textContent('.statusbar')).match(/Day (\d+)/)[1]);
  console.log(
    `[${label}] keyboard steps=${steps} day ${dayAtStart}->${dayNow} echo=${sawEcho} outcomes=${sawOutcomes} locked=${sawLocked}`,
  );
  if (dayNow <= dayAtStart) errors.push(`[${label}] keyboard navigation did not advance the game`);
  if (!sawOutcomes) errors.push(`[${label}] never rendered a consequences panel`);
  if (!sawLocked) errors.push(`[${label}] never rendered a locked choice`);
  if (shots) await page.screenshot({ path: `${OUT}/${label}-4-midgame.png`, fullPage: true });

  // --- Overlays ---
  await page.click('button:has-text("Sheet")');
  await page.waitForSelector('.stat-row');
  const perkTitles = await page.locator('.card-title').allTextContents();
  console.log(`[${label}] perks/cards:`, perkTitles.join(' | '));
  if (shots) await page.screenshot({ path: `${OUT}/${label}-5-sheet.png`, fullPage: true });
  await page.click('button:has-text("Back")');

  await page.click('button:has-text("Map")');
  await page.waitForSelector('.route');
  if (shots) await page.screenshot({ path: `${OUT}/${label}-6-map.png`, fullPage: true });
  await page.click('button:has-text("Back")');

  await page.click('button:has-text("Journal")');
  await page.waitForSelector('h2');
  const journalCount = await page.locator('.journal li').count();
  console.log(`[${label}] journal entries: ${journalCount}`);
  if (shots) await page.screenshot({ path: `${OUT}/${label}-7-journal.png`, fullPage: true });
  await page.click('button:has-text("Back")');

  // --- Reload mid-run to verify autosave ---
  await page.reload({ waitUntil: 'networkidle' });
  const hasContinue = await page.locator('text=Continue').count();
  console.log(`[${label}] continue offered after reload: ${hasContinue > 0}`);
  if (hasContinue) {
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('.statusbar');
    console.log(`[${label}] resumed:`, (await page.textContent('.statusbar')).replace(/\s+/g, ' ').trim());
  }

  // --- Push to an ending ---
  for (let i = 0; i < 200; i++) {
    if (await page.locator('.ending').count()) break;
    const depart = page.locator('.choice:not(:disabled)', { hasText: 'Move on.' });
    if (await depart.count()) await depart.first().click();
    else await page.locator('.choice:not(:disabled)').first().click();
    await page.waitForTimeout(25);
  }

  if (await page.locator('.ending').count()) {
    console.log(`[${label}] ENDING:`, await page.textContent('.ending h1'));
    const summary = await page.textContent('.run-summary');
    console.log(`[${label}] summary:`, summary.replace(/\s+/g, ' ').trim().slice(0, 200));
    if (shots) await page.screenshot({ path: `${OUT}/${label}-8-ending.png`, fullPage: true });
  } else {
    errors.push(`[${label}] never reached an ending`);
  }

  await browser.close();
}

await run('desktop', { viewport: { width: 1440, height: 900 } }, true);
await run('phone', { ...devices['iPhone 13'] }, true);
await run('tv', { viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 1 }, true);

console.log('\n--- errors ---');
console.log(errors.length ? errors.join('\n') : 'none');
process.exit(errors.length ? 1 : 0);
