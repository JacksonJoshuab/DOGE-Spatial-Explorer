#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { webkit } from 'playwright';

const URL_ROOT = new URL((process.env.GH_BASE_URL || 'https://127.0.0.1:4173/').replace(/\/?$/, '/'));
const SITE = path.resolve(process.env.GH_SITE_DIR || 'gonzo-health-spatial-cognition');
const OUT = path.resolve(process.env.GH_OUTPUT_DIR || 'evaluation-output/gonzo-health-ux-v2');
const EXPERIENCE = 'gonzo-health-experience/2.3.0';
const checks=[]; const browserErrors=[]; const shots=[]; let fatal=null;
const add=(id,domain,points,passed,detail,critical=false)=>checks.push({id,domain,points,earned:passed?points:0,passed:!!passed,critical,detail:String(detail)});
const read=f=>fs.readFile(path.join(SITE,f),'utf8');
const visible=async l=>(await l.count())>0&&await l.first().isVisible();
const shot=async(page,name)=>{const file=path.join(OUT,'screenshots',name);await page.screenshot({path:file,fullPage:true});shots.push(file)};
function monitor(page,label,offline){page.on('console',m=>{if(['error','assert'].includes(m.type()))browserErrors.push(`${label}: console ${m.text()}`)});page.on('pageerror',e=>browserErrors.push(`${label}: page ${e.message}`));page.on('response',r=>{if(!offline.value&&r.status()>=400)browserErrors.push(`${label}: HTTP ${r.status()} ${r.url()}`)});page.on('requestfailed',r=>{if(!offline.value)browserErrors.push(`${label}: request ${r.url()} ${r.failure()?.errorText||''}`)})}
async function waitApp(page){await page.waitForSelector('#app:not([hidden])',{timeout:35000});await page.waitForFunction(v=>window.__GONZO_HEALTH_EXPERIENCE__?.version===v,EXPERIENCE,{timeout:20000})}
async function press(page,locator){await locator.waitFor({state:'visible',timeout:15000});await locator.focus();await page.keyboard.press('Enter')}
async function dimensions(page,selector){return page.locator(selector).evaluateAll(nodes=>nodes.filter(n=>{const s=getComputedStyle(n);return s.display!=='none'&&s.visibility!=='hidden'&&n.getClientRects().length}).map(n=>{const r=n.getBoundingClientRect();return{w:r.width,h:r.height,label:n.getAttribute('aria-label')||n.textContent?.trim()||''}}))}

await fs.mkdir(path.join(OUT,'screenshots'),{recursive:true});
const names=['index.html','boot.mjs','brand-refresh.mjs','brand-refresh.css','light-theme.css','experience-v2.mjs','experience-v2.css','manifest.webmanifest','service-worker.js','healthcheck.json','privacy.html','support.html'];
const source=Object.fromEntries(await Promise.all(names.map(async n=>[n,await read(n)])));
const health=JSON.parse(source['healthcheck.json']); const manifest=JSON.parse(source['manifest.webmanifest']); const joined=Object.values(source).join('\n');
const payloads=new Set(source['service-worker.js'].match(/payload\/g\d{2}\/\d{3}\.txt/g)||[]).size;
add('contract.responses-anchors','exam',10,JSON.stringify(health.batteryResponseCounts)===JSON.stringify([36,132,252])&&health.sharedAnchors===12,'36/132/252 response contracts and 12 shared anchors remain intact.',true);
add('contract.presentation-only','exam',5,/MutationObserver/.test(source['experience-v2.mjs'])&&!/(scoreSession|generateBattery|ScoringEngine|evaluateAdaptiveWindow|measurementModelVersion\s*=|validity\s*=)/.test(source['experience-v2.mjs']),'Experience layer is presentation-only.',true);
add('pwa.assets','pwa',5,payloads===48&&['experience-v2.mjs','experience-v2.css','index.html','offline.html'].every(f=>source['service-worker.js'].includes(f)),`Offline cache includes ${payloads}/48 payload chunks and the experience shell.`,true);
add('privacy.boundary','privacy',5,!/(OPENAI_API_KEY|sk-proj-|sk-[A-Za-z0-9_-]{32,}|google-analytics|mixpanel|amplitude\.com|segment\.com)/i.test(joined)&&/private-by-default|local-first|local by default/i.test(joined)&&/not a diagnosis|non-diagnostic/i.test(joined),'No public secret/tracker marker; local-first and non-diagnostic language remains.',true);

let browser;
try{
 browser=await webkit.launch({headless:true});
 const audits=[];
 for(const spec of [{name:'phone',viewport:{width:390,height:844},motion:'no-preference'},{name:'tablet',viewport:{width:768,height:1024},motion:'reduce'},{name:'desktop',viewport:{width:1440,height:1000},motion:'no-preference'}]){
  const context=await browser.newContext({viewport:spec.viewport,reducedMotion:spec.motion,serviceWorkers:'allow'});const page=await context.newPage();const offline={value:false};monitor(page,spec.name,offline);
  const response=await page.goto(URL_ROOT.href,{waitUntil:'domcontentloaded',timeout:45000});await waitApp(page);
  const base=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,theme:document.documentElement.dataset.theme,generations:document.querySelectorAll('[data-generation]').length,batteries:document.querySelectorAll('[data-battery]').length,meta:document.querySelectorAll('.gh-exam-meta').length,readiness:!!document.querySelector('.gh-readiness'),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
  const targets=await dimensions(page,'[data-generation],[data-battery],[data-action="start"],[data-action="demo"],.gh-theme-toggle');
  const targetPass=targets.length>=8&&targets.every(x=>x.w>=42&&x.h>=42);
  await shot(page,`${spec.name}-lobby.png`);
  await page.evaluate(()=>document.documentElement.dataset.contrast='high');
  const hc=await page.locator('.glass,.topbar').first().evaluate(el=>{const s=getComputedStyle(el);return{bg:s.backgroundColor,filter:s.backdropFilter||s.webkitBackdropFilter||'none'}});
  const contrast=/rgb\(0, 0, 0\)|rgba\(0, 0, 0, 1\)/.test(hc.bg)&&hc.filter==='none';
  await page.evaluate(()=>{document.documentElement.dataset.contrast='normal';document.documentElement.style.fontSize='200%'});
  const zoom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,primary:[...document.querySelectorAll('button')].some(b=>/start daily|18-second demo/i.test(b.textContent||'')&&b.getClientRects().length)}));
  audits.push({name:spec.name,response:response?.ok(),base,targets,targetPass,contrast,zoomPass:zoom.primary&&zoom.scroll<=zoom.client+32,hc});await context.close();
 }
 add('exam.clarity-runtime','exam',10,audits.every(a=>a.response&&a.base.generations===7&&a.base.batteries===3&&a.base.meta>=3&&a.base.readiness),'All tested viewports expose seven themes, three annotated batteries, and readiness guidance.',true);
 add('access.targets-responsive','accessibility',10,audits.every(a=>a.targetPass&&a.base.scroll<=a.base.client+32&&a.zoomPass),`Touch/reflow audit: ${audits.map(a=>`${a.name}[targets=${a.targetPass},normal=${a.base.scroll}/${a.base.client},zoom=${a.zoomPass}]`).join(' ')}`,true);
 add('access.contrast-motion','accessibility',10,audits.every(a=>a.contrast)&&audits.find(a=>a.name==='tablet')?.base.reduced===true,'High contrast is opaque and reduced-motion preference is active.',true);

 const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'allow'});const page=await context.newPage();const offline={value:false};monitor(page,'flow',offline);
 await page.goto(URL_ROOT.href,{waitUntil:'domcontentloaded',timeout:45000});await waitApp(page);
 const light=await page.evaluate(()=>document.documentElement.dataset.theme==='light');const toggle=page.locator('[data-gh-theme-toggle]').first();await press(page,toggle);const dark=await page.evaluate(()=>document.documentElement.dataset.theme==='dark'&&localStorage.getItem('gonzo-health-theme')==='dark');await page.reload({waitUntil:'domcontentloaded'});await waitApp(page);const persisted=await page.evaluate(()=>document.documentElement.dataset.theme==='dark');await page.evaluate(()=>localStorage.removeItem('gonzo-health-theme'));await page.reload({waitUntil:'domcontentloaded'});await waitApp(page);add('pwa.theme','pwa',5,light&&dark&&persisted,'Light is default and keyboard-selected dark appearance persists.');
 await press(page,page.locator('[data-generation="genx"]').first());await press(page,page.locator('[data-battery="daily"]').first());await press(page,page.getByRole('button',{name:/run 18-second demo|watch walkthrough|18-second|\bdemo\b/i}).first());
 const modal=page.locator('#consent-modal');if(await modal.count()){await modal.waitFor({state:'visible',timeout:10000});const consent=modal.locator('input[type="checkbox"]').first();if(await consent.count()){await consent.focus();await page.keyboard.press('Space')}const proceed=modal.getByRole('button',{name:/continue|agree|begin|start/i}).last();if(await proceed.count())await press(page,proceed)}
 await page.waitForSelector('.test-layout,.stage,.test-stage',{timeout:20000});const guide=await visible(page.locator('.gh-session-guide'));const stop=await visible(page.locator('[data-action="stop"],button[title*="Stop" i]'));const pause=await visible(page.locator('[data-action="pause"],button[title*="Pause" i]'));const responseTargets=await dimensions(page,'.controls button,.response button,.choices button,.responses button');const responsesOK=responseTargets.length>0&&responseTargets.every(x=>x.w>=42&&x.h>=42);await shot(page,'desktop-assessment.png');add('exam.keyboard-flow','functionality',15,guide&&stop&&pause&&responsesOK,`Keyboard flow reached exam; guide=${guide}, stop=${stop}, pause=${pause}, responseTargets=${responseTargets.length}.`,true);
 await page.waitForFunction(()=>/results|performance profile|validity/i.test(document.querySelector('#app')?.textContent||''),null,{timeout:75000});await page.waitForSelector('.gh-report-explainer',{timeout:10000});const report=await page.evaluate(()=>({copy:(document.querySelector('.gh-report-explainer')?.textContent||'').toLowerCase(),next:!!document.querySelector('.gh-next-actions'),repeat:!!document.querySelector('[data-gh-repeat]'),history:!!document.querySelector('[data-gh-history]'),export:!!document.querySelector('[data-gh-export]')}));await shot(page,'desktop-results.png');add('report.validity-first','reporting',10,/snapshot/.test(report.copy)&&/not a diagnosis/.test(report.copy),'Results establish snapshot/uncertainty and non-diagnostic interpretation first.',true);add('report.next-actions','reporting',5,report.next&&report.repeat&&report.history&&report.export,'Results provide repeat, trend, and export actions.');
 await page.goto(URL_ROOT.href,{waitUntil:'domcontentloaded'});await waitApp(page);await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,null,{timeout:25000}).catch(async()=>{await page.reload({waitUntil:'domcontentloaded'});await waitApp(page);await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,null,{timeout:15000})});offline.value=true;await context.setOffline(true);let offlineOK=false;try{await page.goto(new URL('?battery=daily&audit=offline',URL_ROOT).href,{waitUntil:'domcontentloaded',timeout:20000});await page.waitForSelector('#app:not([hidden])',{timeout:15000});offlineOK=true}catch{}finally{await context.setOffline(false);offline.value=false}add('pwa.offline','pwa',5,offlineOK,'Uncached battery deep link loads from the cached app shell while offline.',true);await context.close();
}catch(error){fatal=error instanceof Error?`${error.name}: ${error.message}`:String(error);add('evaluation.execution','quality',0,false,fatal,true)}finally{if(browser)await browser.close()}
add('quality.browser-errors','quality',5,browserErrors.length===0,browserErrors.length?browserErrors.join(' | '):'No critical browser errors.',true);
const total=checks.reduce((s,c)=>s+c.points,0),earned=checks.reduce((s,c)=>s+c.earned,0),critical=checks.filter(c=>c.critical&&!c.passed),score=total?Math.round(earned/total*100):0,passed=score>=90&&critical.length===0&&!fatal;
const data={schema:'gonzo-health-ux-evaluation/2.1',url:URL_ROOT.href,experience:EXPERIENCE,score,passed,totalPoints:total,earnedPoints:earned,fatal,criticalFailures:critical,checks,browserErrors,screenshots:shots,generatedAt:new Date().toISOString()};await fs.writeFile(path.join(OUT,'report.json'),JSON.stringify(data,null,2));const lines=['# Gonzo | Health UX Evaluation v2','',`**Score: ${score}/100 — ${passed?'PASS':'FAIL'}**`,'',`Critical failures: **${critical.length}**`,'','| Check | Domain | Score | Critical | Result |','|---|---|---:|:---:|:---:|',...checks.map(c=>`| ${c.id} | ${c.domain} | ${c.earned}/${c.points} | ${c.critical?'Yes':'No'} | ${c.passed?'PASS':'FAIL'} |`),'','## Details',...checks.map(c=>`- **${c.id}:** ${c.detail}`),'','## Browser errors','',browserErrors.length?browserErrors.map(x=>`- ${x}`).join('\n'):'None.',...(fatal?['','## Fatal evaluator error','',fatal]:[])];await fs.writeFile(path.join(OUT,'report.md'),lines.join('\n'));console.log(lines.join('\n'));if(!passed)process.exit(1);
