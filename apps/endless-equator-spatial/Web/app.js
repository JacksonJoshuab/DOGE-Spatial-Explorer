const state = { areas: [], route: null, selected: null, map: null };
const list = document.querySelector('#area-list');
const detail = document.querySelector('#area-detail');
const search = document.querySelector('#search');
const network = document.querySelector('#network');

const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function boot(){
  const [areasResponse, routeResponse] = await Promise.all([fetch('/api/areas'), fetch('/api/route')]);
  if(!areasResponse.ok || !routeResponse.ok) throw new Error('Canonical expedition data is unavailable');
  state.areas = await areasResponse.json();
  state.route = await routeResponse.json();
  const slug = new URL(location.href).searchParams.get('area');
  state.selected = state.areas.find(a => a.slug === slug) || state.areas[0];
  renderList(); renderArea(); drawFallback();
  await enhanceWithMapKit();
}

function renderList(query=''){
  const q = query.trim().toLowerCase();
  list.replaceChildren(...state.areas.filter(a => !q || JSON.stringify(a).toLowerCase().includes(q)).map(a => {
    const button = document.createElement('button');
    button.className='area-button'; button.type='button'; button.dataset.id=a.id;
    button.setAttribute('aria-current', String(a.id===state.selected?.id));
    button.innerHTML=`<strong>${escapeHTML(a.name)}</strong><small>${escapeHTML(a.category)} · ${escapeHTML(a.highwayRefs.join(' / ')||'local')}</small>`;
    button.addEventListener('click',()=>selectArea(a)); return button;
  }));
}

function selectArea(area){
  state.selected=area;
  history.replaceState({},'',`/?area=${encodeURIComponent(area.slug)}`);
  renderList(search.value); renderArea(); focusMap(area);
}

function renderArea(){
  const a=state.selected; if(!a) return;
  detail.innerHTML=`
    <div class="kicker">${escapeHTML(a.category)} · ${escapeHTML(a.verificationState)}</div>
    <h1>${escapeHTML(a.name)}</h1>
    <p>${escapeHTML(a.summary)}</p>
    <div>${a.highwayRefs.map(x=>`<span class="badge">${escapeHTML(x)}</span>`).join('')}<span class="badge warning">${escapeHTML(a.verificationNote)}</span></div>
    <div class="grid">
      <section class="card"><h2>September</h2><p>${escapeHTML(a.seasonalWeather.september)}</p></section>
      <section class="card"><h2>October</h2><p>${escapeHTML(a.seasonalWeather.october)}</p></section>
      <section class="card"><h2>Position</h2><p>${a.coordinate.latitude.toFixed(5)}, ${a.coordinate.longitude.toFixed(5)}${a.altitudeMeters?` · ${a.altitudeMeters} m`:''}</p></section>
    </div>
    <section class="card"><h2>Safety</h2><ul>${a.safetyNotes.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul></section>
    <section class="card"><h2>Spatial-production notes</h2><ul>${a.filmingNotes.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul></section>
    ${a.sections.map(s=>`<section class="card"><h2>${escapeHTML(s.title)}</h2><p>${escapeHTML(s.body)}</p></section>`).join('')}`;
}

function drawFallback(){
  const svg=document.querySelector('#fallback-map');
  const points=state.route.points.map(p=>p.coordinate);
  const lats=points.map(p=>p.latitude), lons=points.map(p=>p.longitude);
  const minLat=Math.min(...lats)-.15,maxLat=Math.max(...lats)+.15,minLon=Math.min(...lons)-.15,maxLon=Math.max(...lons)+.15;
  const project=p=>({x:50+(p.longitude-minLon)/(maxLon-minLon)*800,y:470-(p.latitude-minLat)/(maxLat-minLat)*420});
  const projected=points.map(project);
  const path=projected.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  svg.innerHTML=`<defs><radialGradient id="g"><stop stop-color="#2f6657"/><stop offset="1" stop-color="#0a1512"/></radialGradient></defs><rect width="900" height="520" fill="url(#g)"/><path class="route-line" d="${path}"/>${projected.map((p,i)=>`<circle class="route-point" cx="${p.x}" cy="${p.y}" r="${i===0?8:5}"/>`).join('')}<text x="24" y="34" fill="#fff" opacity=".7">Offline planning schematic · not turn authorization</text>`;
}

async function enhanceWithMapKit(){
  try{
    const tokenResponse=await fetch('/api/mapkit-token');
    if(!tokenResponse.ok) throw new Error('MapKit token not configured');
    const {token}=await tokenResponse.json();
    const mapkit = await loadMapKit6(token, ['full-map','annotations','overlays']);
    const mapNode=document.querySelector('#map'); mapNode.replaceChildren();
    state.map=new mapkit.Map(mapNode,{center:{latitude:-0.75,longitude:-78.6},cameraDistance:650000,showsZoomControl:true,showsCompass:mapkit.FeatureVisibility.Visible});
    const line=new mapkit.PolylineOverlay(state.route.points.map(p=>p.coordinate),{style:new mapkit.Style({lineWidth:5,strokeColor:'#ffb02e'})});
    state.map.addOverlay(line);
    state.map.addAnnotations(state.areas.map(a=>new mapkit.MarkerAnnotation(a.coordinate,{title:a.name,subtitle:a.verificationState,glyphText:'•',data:{id:a.id}})));
    network.textContent='MapKit JS 6 · online'; focusMap(state.selected);
  }catch(error){ network.textContent='offline schematic'; console.info(error.message); }
}

function focusMap(area){
  if(state.map && area) state.map.setCenterAnimated(area.coordinate,true);
}

async function loadMapKit6(token,libraries=[]){
  if(window.mapkit?.load) return libraries.length ? window.mapkit.load(libraries) : window.mapkit;
  let script=document.head.querySelector('script[data-endless-equator-mapkit]');
  if(!script){
    script=document.createElement('script');
    script.async=true;
    script.crossOrigin='';
    script.src='https://cdn.apple-mapkit.com/mk/6/mapkit.core.js';
    script.dataset.endlessEquatorMapkit='true';
    script.dataset.callback='initEndlessEquatorMapKit';
    script.dataset.token=token;
    if(libraries.length) script.dataset.libraries=libraries.join(',');
    document.head.append(script);
  }
  const mapkit=window.mapkit || await new Promise((resolve,reject)=>{
    const onLoad=()=>{cleanup();resolve(window.mapkit);};
    const onError=()=>{cleanup();reject(new Error('MapKit JS failed to load'));};
    const cleanup=()=>{script.removeEventListener('load',onLoad);script.removeEventListener('error',onError);};
    script.addEventListener('load',onLoad,{once:true});
    script.addEventListener('error',onError,{once:true});
  });
  if(!mapkit?.load) throw new Error('MapKit JS namespace is unavailable');
  return libraries.length ? mapkit.load(libraries) : mapkit;
}
search.addEventListener('input',e=>renderList(e.target.value));
window.addEventListener('online',()=>network.textContent='online');
window.addEventListener('offline',()=>network.textContent='offline');
if('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(console.warn);
boot().catch(error=>{detail.innerHTML=`<h1>Unable to load</h1><p>${escapeHTML(error.message)}</p>`;});
