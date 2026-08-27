#!/usr/bin/env node
import { webkit } from 'playwright';

const url=process.env.GH_BASE_URL||'https://localhost:4173/';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'allow',ignoreHTTPSErrors:true});
const page=await context.newPage();
await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#app:not([hidden])',{timeout:35000});
await page.waitForFunction(()=>window.__GONZO_HEALTH_EXPERIENCE__?.version==='gonzo-health-experience/2.3.5',null,{timeout:20000});
const press=async locator=>{await locator.waitFor({state:'visible',timeout:15000});await locator.focus();await page.keyboard.press('Enter')};
await press(page.locator('[data-generation="genx"]').first());
await press(page.locator('[data-battery="daily"]').first());
await press(page.getByRole('button',{name:/run 18-second demo|watch walkthrough|18-second|\bdemo\b/i}).first());
const modal=page.locator('#consent-modal');
if(await modal.count()){
  await modal.waitFor({state:'visible',timeout:10000});
  const checkbox=modal.locator('input[type="checkbox"]').first();
  if(await checkbox.count()&&!await checkbox.isChecked())await checkbox.check();
  const buttons=modal.getByRole('button');let chosen=null;
  for(let i=0;i<await buttons.count();i++){
    const button=buttons.nth(i);const name=((await button.getAttribute('aria-label'))||await button.textContent()||'').trim();
    if(/continue|agree|begin|start|proceed/i.test(name)&&!/cancel|back|close|stop/i.test(name))chosen=button;
  }
  if(chosen)await press(chosen);
}
await page.waitForSelector('[data-gh-exam-root]',{timeout:20000});
await page.waitForTimeout(600);
const snapshot=await page.evaluate(()=>{
  const root=document.querySelector('[data-gh-exam-root]');
  const rr=root.getBoundingClientRect();
  const lower=rr.top+rr.height*.5;
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  const describe=element=>{
    const r=element.getBoundingClientRect();const s=getComputedStyle(element);
    return{
      tag:element.tagName.toLowerCase(),id:element.id||null,class:element.className?.baseVal||element.className||null,
      role:element.getAttribute('role'),tabindex:element.getAttribute('tabindex'),aria:element.getAttribute('aria-label'),title:element.getAttribute('title'),
      text:clean(element.textContent).slice(0,120),inner:clean(element.innerText).slice(0,120),
      rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},
      display:s.display,position:s.position,cursor:s.cursor,pointer:s.pointerEvents,background:s.backgroundColor,
      data:Object.fromEntries([...element.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value]))
    }
  };
  const all=[...root.querySelectorAll('*')];
  const lowerElements=all.filter(element=>{
    const r=element.getBoundingClientRect();
    return r.width>0&&r.height>0&&r.top>=lower&&r.width<=320&&r.height<=180;
  }).map(describe);
  const colorLike=all.filter(element=>/red|blue|green|yellow|orange|purple|\bR\b|\bB\b|\bG\b|\bY\b|\bO\b|\bP\b/i.test(`${element.textContent||''} ${element.innerText||''} ${element.getAttribute('aria-label')||''} ${element.className||''}`)).map(describe);
  const points=[];
  for(const y of [rr.top+rr.height*.72,rr.top+rr.height*.78,rr.top+rr.height*.84,rr.top+rr.height*.9]){
    for(let x=rr.left+rr.width*.1;x<rr.right-rr.width*.05;x+=rr.width*.1){
      points.push({x:Math.round(x),y:Math.round(y),elements:document.elementsFromPoint(x,y).slice(0,6).map(describe)});
    }
  }
  return{root:describe(root),lowerBoundary:Math.round(lower),marked:[...root.querySelectorAll('[data-gh-response]')].map(describe),lowerElements,colorLike,points};
});
console.log(JSON.stringify(snapshot,null,2));
await page.screenshot({path:'response-dom-inspection.png',fullPage:true});
await browser.close();
