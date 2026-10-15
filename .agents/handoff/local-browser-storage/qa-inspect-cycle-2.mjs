import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const base = new URL('./', import.meta.url);
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: {width, height: width === 375 ? 812 : 1000} });
    const page = await context.newPage();
    const errors = [], external = [], httpErrors = [];
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {if(r.status() >= 400) httpErrors.push({status:r.status(),url:r.url()});});
    await page.route('**/*', async route => {
      if(new URL(route.request().url()).hostname !== 'localhost') {external.push(route.request().url()); await route.abort();}
      else await route.continue();
    });
    await page.goto('http://localhost:4173');
    await page.getByTestId('storage-mode-badge').waitFor();
    const chart = page.getByTestId('projection-chart');
    await chart.scrollIntoViewIfNeeded();
    const labels = page.locator('[data-testid^="chart-x-tick-"]');
    const bounds = await labels.evaluateAll(nodes => nodes.map(n => ({text:n.textContent,left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right,x:Number(n.getAttribute('x'))})));
    const spacing = bounds.slice(1).map((b,i)=>b.left-bounds[i].right);
    if(spacing.some(g=>g<0)) throw Error('Labels overlap');
    const original = {date:await page.getByTestId('chart-date-headline').innerText(),capital:await page.getByTestId('chart-capital-value').innerText()};
    const rect = await chart.boundingBox();
    const first = rect.x + bounds[0].x, last = rect.x + bounds.at(-1).x, y = rect.y + 100;
    await page.mouse.click(first,y);
    const start = {date:await page.getByTestId('chart-date-headline').innerText(),capital:await page.getByTestId('chart-capital-value').innerText()};
    await page.mouse.move(first,y); await page.mouse.down(); await page.mouse.move(last,y,{steps:12}); await page.mouse.up();
    await page.getByTestId('chart-date-headline').filter({hasText:'Octobre 2029'}).waitFor();
    const end = {date:await page.getByTestId('chart-date-headline').innerText(),capital:await page.getByTestId('chart-capital-value').innerText()};
    await page.mouse.click(first+(last-first)/3,y);
    await page.getByTestId('chart-date-headline').filter({hasText:original.date}).waitFor();
    const restored = {date:await page.getByTestId('chart-date-headline').innerText(),capital:await page.getByTestId('chart-capital-value').innerText()};
    if(restored.capital!==original.capital || !/^0\s*€$/.test(start.capital)) throw Error('Selection changed');
    await chart.screenshot({path:new URL(`screens/qa-chart-${width}-cycle-2.png`,base).pathname});
    await page.screenshot({path:new URL(`screens/qa-dashboard-${width}-cycle-2.png`,base).pathname});
    const overflow = await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
    if(errors.length || external.length || httpErrors.length || overflow.document > width) throw Error(JSON.stringify({errors,external,httpErrors,overflow}));
    results.push({width,bounds,spacing,original,start,end,restored,overflow,errors,external,httpErrors});
    await context.close();
  }
  await writeFile(new URL('qa-browser-evidence-cycle-2.json',base), JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
