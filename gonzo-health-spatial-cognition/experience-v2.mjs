const VERSION='gonzo-health-experience/2.3.4';
const app=document.querySelector('#app');
const $=(selector,root=app)=>root?.querySelector(selector);
const $$=(selector,root=app)=>[...(root?.querySelectorAll(selector)||[])];
const responseKeys={red:'r',blue:'b',green:'g',yellow:'y',orange:'o',purple:'p'};

function accessibleName(element){return [element.getAttribute('aria-label'),element.getAttribute('title'),element.innerText,element.textContent].filter(Boolean).join(' ').replace(/\s+/g,' ').trim()}
function normalizedWords(value){return String(value||'').toLowerCase().replace(/[^a-z]+/g,' ').trim()}
function responseDescriptor(value){
  const raw=String(value||'').toLowerCase();
  const compact=raw.replace(/[^a-z]+/g,'');
  const words=normalizedWords(raw).split(/\s+/).filter(Boolean);
  const colors=Object.keys(responseKeys).filter(color=>words.includes(color)||compact===`${color}${responseKeys[color]}`||compact===`${responseKeys[color]}${color}`);
  if(colors.length!==1)return null;
  const color=colors[0],key=responseKeys[color];
  const exactCompact=compact===`${color}${key}`||compact===`${key}${color}`;
  if(!exactCompact&&!words.includes(key))return null;
  return{color,label:color[0].toUpperCase()+color.slice(1)}
}
function addSkip(){if(document.querySelector('.gh-skip'))return;const link=document.createElement('a');link.className='gh-skip';link.href='#app';link.textContent='Skip to activity';document.body.prepend(link)}
function normalizeLobbyActions(){for(const button of $$('button')){const name=accessibleName(button);if(/18-second demo|walkthrough|\bdemo\b/i.test(name)&&!button.dataset.action)button.dataset.action='demo';if(/start daily|begin 180-second|start assessment/i.test(name)&&!button.dataset.action)button.dataset.action='start'}}
function annotateBattery(){const definitions={daily:['3 min','36 responses','Quick baseline'],standard:['15 min','132 responses','Deeper profile'],research:['30–45 min','252 responses','Research depth']};for(const card of $$('[data-battery]')){if(card.querySelector('.gh-exam-meta'))continue;const values=definitions[card.dataset.battery];if(!values)continue;const metadata=document.createElement('div');metadata.className='gh-exam-meta';metadata.innerHTML=values.map(value=>`<span>${value}</span>`).join('');card.append(metadata)}}
function addReadiness(){const hero=$('.hero,.hero-stage');if(!hero||$('.gh-readiness'))return;const readiness=document.createElement('aside');readiness.className='gh-readiness';readiness.innerHTML='<strong>Before you begin</strong><span>Quiet space</span><span>Comfortable viewing distance</span><span>Use your normal input method</span><span>Accuracy before speed</span>';hero.insertAdjacentElement('afterend',readiness)}
function findExamRoot(){const explicit=$('.test-layout,.assessment-layout,.assessment-screen,[data-view="assessment"]');if(explicit&&!explicit.querySelector('[data-generation],[data-battery]'))return explicit;const text=(app?.textContent||'').replace(/\s+/g,' ');const control=$$('button,[role="button"],[tabindex]').find(element=>/pause|resume|stop session|end session|exit assessment|time remaining|Ⅱ|⏸|×|✕|✖/i.test(accessibleName(element)));if(control&&/trial\s*\d+|time remaining|guided practice|core stroop|response window/i.test(text))return control.closest('.page,.test-layout,.assessment-layout')||app;return null}
function markResponseTargets(){
  const rootRect=app.getBoundingClientRect();
  const candidates=$$('*',app).filter(element=>element.children.length<=8&&responseDescriptor(element.innerText||element.textContent));
  const marked=new Set();
  for(const leaf of candidates){
    const descriptor=responseDescriptor(leaf.innerText||leaf.textContent);if(!descriptor)continue;
    const leafRect=leaf.getBoundingClientRect();if(!leafRect.width||!leafRect.height)continue;
    let node=leaf;let best=null;
    for(let depth=0;node&&node!==app&&depth<6;depth++,node=node.parentElement){
      const rect=node.getBoundingClientRect();
      if(rect.width>=44&&rect.height>=40&&rect.width<=Math.max(260,rootRect.width*.5))best=node;
      if(node.matches('button,[role="button"],[tabindex],[data-response],[data-color],label')){best=node;break}
    }
    const target=best||leaf;if(marked.has(target))continue;marked.add(target);
    target.dataset.ghResponse='';target.dataset.ghColor=descriptor.color;target.setAttribute('aria-label',`Respond ${descriptor.label}`);
    if(!target.matches('button,a,input,select,textarea,[role="button"]')){
      target.setAttribute('role','button');if(!target.hasAttribute('tabindex'))target.tabIndex=0;
      if(!target.dataset.ghKeyboardBound){target.dataset.ghKeyboardBound='true';target.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();target.click()}})}
    }
  }
}
function normalizeExamControls(){
  for(const element of $$('button,[role="button"],[tabindex]')){const name=accessibleName(element);if(/pause|Ⅱ|⏸/i.test(name)){element.dataset.action='pause';if(!element.getAttribute('aria-label'))element.setAttribute('aria-label','Pause assessment')}else if(/stop session|end session|exit assessment|close assessment|×|✕|✖/i.test(name)){element.dataset.action='stop';if(!element.getAttribute('aria-label'))element.setAttribute('aria-label','Stop assessment')}}
  markResponseTargets();const progress=$('[role="progressbar"],.progress');if(progress&&!progress.getAttribute('aria-label'))progress.setAttribute('aria-label','Assessment progress')
}
function ensureSessionGuide(){let guide=document.querySelector('#gh-session-guide');if(!guide){guide=document.createElement('div');guide.id='gh-session-guide';guide.className='gh-session-guide';guide.setAttribute('role','status');guide.setAttribute('aria-label','Assessment sequence: understand, respond, recover, review');guide.innerHTML='<span><b>1</b> Understand</span><span><b>2</b> Respond</span><span><b>3</b> Recover</span><span><b>4</b> Review</span>';document.body.append(guide)}return guide}
function removeSessionGuide(){document.querySelector('#gh-session-guide')?.remove();delete document.body.dataset.ghExam}
function enhanceExam(root){root.dataset.ghExamRoot=VERSION;document.body.dataset.ghExam='active';document.body.dataset.ghView='assessment';normalizeExamControls();ensureSessionGuide()}
function findResultsRoot(){if(findExamRoot())return null;if($('[data-generation],[data-battery]'))return null;const explicit=$('.results,.results-view,.results-layout,.result-dashboard,[data-view="results"]');if(explicit)return explicit;const text=(app?.textContent||'').replace(/\s+/g,' ').toLowerCase();if(/session history|saved sessions/.test(text))return null;const metricHits=['accuracy','median rt','interference','validity','consistency','delayed recall','game score','overall score'].filter(term=>text.includes(term)).length;const resultSignal=/session complete|performance profile|your performance|focus legend|interference master|color detective|focus explorer|practice path|final results/.test(text);return resultSignal&&metricHits>=2?(app.querySelector('.page,main,section')||app):null}
function enhanceResults(root){document.body.dataset.ghView='results';if(root.dataset.ghReport===VERSION)return;root.dataset.ghReport=VERSION;root.dataset.ghReportRoot=VERSION;const section=document.createElement('section');section.className='gh-report-explainer';section.innerHTML='<div><span class="eyebrow">How to read this</span><h2>One session is a snapshot, not a diagnosis.</h2><p>Start with session validity and accuracy, then review response speed and consistency. Trends become more useful after repeated comparable sessions.</p></div><div class="gh-report-legend"><span><i class="good"></i>Stable strength</span><span><i class="watch"></i>Worth watching</span><span><i class="caution"></i>Use caution</span></div>';const score=root.querySelector('.score,.score-ring,.hero-score,[data-score]');if(score)score.insertAdjacentElement('afterend',section);else root.prepend(section);const next=document.createElement('section');next.className='gh-next-actions';next.innerHTML='<h3>Recommended next steps</h3><div><button type="button" data-gh-repeat>Repeat comparable check</button><button type="button" data-gh-history>Review trend</button><button type="button" data-gh-export>Export evidence</button></div><small>Useful goals include a metric, baseline, target, timeframe, and guardrail.</small>';root.append(next);next.querySelector('[data-gh-repeat]')?.addEventListener('click',()=>location.href='./?battery=daily');next.querySelector('[data-gh-history]')?.addEventListener('click',()=>app.querySelector('[data-nav="history"]')?.click());next.querySelector('[data-gh-export]')?.addEventListener('click',()=>app.querySelector('[data-action="export"],button[title*="Export" i],button[aria-label*="Export" i]')?.click())}
function addReportNav(){const nav=$('nav');if(!nav||nav.querySelector('[data-gh-report-help]'))return;const button=document.createElement('button');button.type='button';button.dataset.ghReportHelp='';button.textContent='How scoring works';button.addEventListener('click',()=>{const target=$('.gh-report-explainer,.anchor-panel,.anchor-bridge');target?.scrollIntoView({behavior:document.documentElement.dataset.motion==='reduced'?'auto':'smooth',block:'center'})});nav.append(button)}
function keyboard(){document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.dataset.ghExam==='active'){const stop=$('[data-action="stop"]');if(stop){event.preventDefault();stop.focus()}}if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){const start=$('[data-action="start"]');if(start){event.preventDefault();start.click()}}})}
function enhance(){if(!app||app.hidden)return;addSkip();normalizeLobbyActions();annotateBattery();addReadiness();addReportNav();const exam=findExamRoot();if(exam)enhanceExam(exam);else{removeSessionGuide();const results=findResultsRoot();if(results)enhanceResults(results);else document.body.dataset.ghView='lobby'}document.documentElement.dataset.ghExperience=VERSION}
let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})}).observe(app,{subtree:true,childList:true});keyboard();enhance();window.addEventListener('pageshow',enhance);window.__GONZO_HEALTH_EXPERIENCE__=Object.freeze({version:VERSION,examExpanded:true,reportingExpanded:true,stateDetection:'explicit',responseSemantics:'rendered-color-hotkey'});