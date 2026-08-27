import { webkit } from 'playwright';
const url=process.env.GH_BASE_URL||'http://127.0.0.1:4173/';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
const page=await context.newPage();
const consoleMessages=[];const pageErrors=[];const failed=[];
page.on('console',m=>consoleMessages.push(`${m.type()}: ${m.text()}`));
page.on('pageerror',e=>pageErrors.push(e.message));
page.on('requestfailed',r=>failed.push(`${r.url()} ${r.failure()?.errorText||''}`));
const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(7000);
const state=await page.evaluate(()=>({
  status:document.readyState,
  appHidden:document.querySelector('#app')?.hidden,
  bootText:document.querySelector('#boot')?.textContent?.replace(/\s+/g,' ').trim(),
  hasDecompressionStream:'DecompressionStream' in window,
  brand:window.__GONZO_HEALTH_BRAND__||null,
  experience:window.__GONZO_HEALTH_EXPERIENCE__||null,
  scripts:[...document.scripts].map(s=>s.src),
  styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>x.href)
}));
console.log(JSON.stringify({http:response?.status(),state,consoleMessages,pageErrors,failed},null,2));
await browser.close();
if(state.appHidden)process.exit(1);
