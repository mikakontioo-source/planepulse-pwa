
const $=id=>document.getElementById(id);const state={aircraft:[],lastFlight:null,timer:null,photoCache:{},logoCache:{},diag:{},tracks:{}};
const defaults={lat:60.2934,lon:25.0378,radius:50,refresh:10000,mode:'closest',locationSource:'fixed',photos:true,routeProvider:'vrs',routeApiKey:''};
function settings(){return {...defaults,...JSON.parse(localStorage.getItem('pp-settings')||'{}')}}function saveSettings(s){localStorage.setItem('pp-settings',JSON.stringify(s))}
function km(n){return isFinite(n)?`${Number(n).toFixed(Number(n)<10?1:0)} km`:'-- km'}function meters(n){return isFinite(n)?`${Math.round(n)} m`:'-- m'}function kmh(n){return isFinite(n)?`${Math.round(n)} km/h`:'-- km/h'}
function toRad(d){return d*Math.PI/180}function distKm(a,b,c,d){const R=6371;const x=toRad(c-a),y=toRad(d-b);const q=Math.sin(x/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function bearing(a,b,c,d){const y=Math.sin(toRad(d-b))*Math.cos(toRad(c));const x=Math.cos(toRad(a))*Math.sin(toRad(c))-Math.sin(toRad(a))*Math.cos(toRad(c))*Math.cos(toRad(d-b));return (Math.atan2(y,x)*180/Math.PI+360)%360}
function dir(deg){const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];return dirs[Math.round(deg/22.5)%16]}
function norm(a,s){const lat=a.lat??a.latitude; const lon=a.lon??a.longitude; const altFt=a.alt_baro??a.alt_geom??a.baro_altitude; const gs=a.gs??a.velocity; const reg=a.r||a.reg||a.registration||''; return {raw:a,lat,lon,flight:(a.flight||a.callsign||a.call||a.hex||'').trim(),type:(a.t||a.type||a.aircraft_type||'').trim(),reg:reg.trim(),alt:typeof altFt==='number'?altFt*0.3048:NaN,speed:typeof gs==='number'?gs*1.852:NaN,track:a.track??a.true_track??0,vr:a.baro_rate??a.geom_rate??a.vertical_rate??0,hex:a.hex||a.icao24||'',airline:(a.flight||'').trim().slice(0,3).toUpperCase(),route:a.route||a.rte||a.flight_route||a.route_text||''}}
function score(a,mode){if(mode==='lowest')return a.alt||999999;if(mode==='audible')return (a.distance*1.8)+(Math.max(0,a.alt)/1000);return a.distance}
function airlineName(code){const map={FIN:'FINNAIR',RYR:'RYANAIR',DLH:'LUFTHANSA',SAS:'SAS',KLM:'KLM',AFR:'AIR FRANCE',BAW:'BRITISH AIRWAYS',NSZ:'NORSE',TAY:'ASL',PGT:'PEGASUS'};return map[(code||'').slice(0,3)]||((code||'AIRLINE').slice(0,3));}
const ICAO_TO_IATA={FIN:'AY',RYR:'FR',DLH:'LH',SAS:'SK',KLM:'KL',AFR:'AF',BAW:'BA',AAL:'AA',UAL:'UA',DAL:'DL',EZY:'U2',WZZ:'W6',THY:'TK',QTR:'QR',UAE:'EK',SWR:'LX',IBE:'IB',PGT:'PC',NAX:'DY',NSZ:'N0',TAY:'3V'};
function localLogoCandidates(code){
  const c=(code||'').replace(/[^A-Z0-9]/g,'').slice(0,3); if(!c)return [];
  const low=c.toLowerCase(); const iata=ICAO_TO_IATA[c];
  const base='https://raw.githubusercontent.com/Jxck-S/airline-logos/main';
  const urls=[];
  if(iata){
    urls.push(
      `https://content.airhex.com/content/logos/airlines_${iata}_r.svg`,
      `https://content.airhex.com/content/logos/airlines_${iata}_s.svg`,
      `https://content.airhex.com/content/logos/airlines_${iata}_350_100_r.png`,
      `https://content.airhex.com/content/logos/airlines_${iata}_200_200_s.png`,
      `https://images.kiwi.com/airlines/64x64/${iata}.png`,
      `https://pics.avs.io/200/80/${iata}.png`,
      `https://img.wway.io/pics/root/${iata}@png?exar=1&rs=fit:300:120`
    );
  }
  urls.push(
    `https://content.airhex.com/content/logos/airlines_${c}_r.svg`,
    `https://content.airhex.com/content/logos/airlines_${c}_s.svg`,
    `https://content.airhex.com/content/logos/airlines_${c}_350_100_r.png`,
    `https://content.airhex.com/content/logos/airlines_${c}_200_200_s.png`,
    `${base}/flightaware_logos/${c}.png`,`${base}/flightaware_logos/${low}.png`,
    `${base}/radarbox_logos/${c}.png`,`${base}/radarbox_logos/${low}.png`,
    `${base}/custom_logos/${c}.png`,`${base}/custom_logos/${low}.png`,
    `${base}/logos/${c}.png`,`${base}/logos/${low}.png`
  );
  return urls;
}
function testImage(url){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(url);img.onerror=()=>resolve('');img.src=url;});}
async function resolveLogo(code){
  const c=(code||'').replace(/[^A-Z0-9]/g,'').slice(0,3); if(!c)return '';
  if(state.logoCache[c]!==undefined)return state.logoCache[c];
  let candidates=localLogoCandidates(c);
  try{const r=await fetch(`/api/logo?code=${encodeURIComponent(c)}`); if(r.ok){const j=await r.json(); if(j.url)candidates=[j.url,...candidates]; if(Array.isArray(j.candidates))candidates=[...j.candidates,...candidates];}}catch(e){}
  candidates=[...new Set(candidates.filter(Boolean))];
  for(const url of candidates){const ok=await testImage(url); if(ok){state.logoCache[c]=ok; return ok;}}
  state.logoCache[c]=''; return '';
}
async function getPhoto(ac){const s=settings();if(!s.photos)return '';const key=ac.reg||ac.hex;if(!key)return '';if(state.photoCache[key]!==undefined)return state.photoCache[key];try{const r=await fetch(`/api/photo?reg=${encodeURIComponent(ac.reg||'')}&hex=${encodeURIComponent(ac.hex||'')}`);const j=await r.json();state.photoCache[key]=j.url||'';return state.photoCache[key]}catch(e){state.photoCache[key]='';return ''}}
function normalizeRouteText(v){
  if(!v)return '';
  if(Array.isArray(v)) v=v.join(' ');
  if(typeof v==='object') v=[v.from||v.origin||v.dep||v.departure,v.to||v.destination||v.arr||v.arrival].filter(Boolean).join(' → ');
  v=String(v).toUpperCase().replace(/\s*-\s*/g,' → ').replace(/\s+TO\s+/g,' → ').replace(/\s+/g,' ').trim();
  const m=v.match(/\b([A-Z]{3,4})\s*(?:→|>)\s*([A-Z]{3,4})\b/);
  return m?`${m[1]} → ${m[2]}`:'';
}
function routeFromAircraft(ac){
  const r=ac.raw||{};
  const candidates=[ac.route,r.route,r.rte,r.flight_route,r.route_text,r.origin&&r.destination?`${r.origin} → ${r.destination}`:'',r.from&&r.to?`${r.from} → ${r.to}`:'',r.departure&&r.arrival?`${r.departure} → ${r.arrival}`:'',r.orig&&r.dest?`${r.orig} → ${r.dest}`:''];
  for(const c of candidates){const out=normalizeRouteText(c); if(out) return out;}
  return '';
}
async function resolveRoute(ac){
  const direct=routeFromAircraft(ac); if(direct){state.diag.route='DIRECT'; return direct;}
  const s=settings();
  const provider=s.routeProvider||'vrs';
  if(provider==='off'){state.diag.route='OFF'; return '';}
  const f=(ac.flight||'').replace(/[^A-Z0-9]/g,''); if(!f){state.diag.route='NO FLIGHT'; return '';}
  const key=(s.routeApiKey||'').trim();
  if((provider==='aerodatabox'||provider==='aviationstack')&&!key){state.diag.route='NO API KEY'; return '';}
  try{
    const r=await fetch(`/api/route?flight=${encodeURIComponent(f)}&provider=${encodeURIComponent(provider)}&key=${encodeURIComponent(key)}`);
    if(r.ok){const j=await r.json(); const route=normalizeRouteText(j.route||j.text||''); state.diag.route=route?(j.source||provider).toUpperCase():(j.reason||'NOT FOUND').toUpperCase(); return route;}
  }catch(e){}
  state.diag.route='ERROR';
  return '';
}
function trend(ac){const v=Number(ac.vr)||0;if(v>128)return {rot:-25,pulse:true};if(v<-128)return {rot:25,pulse:true};return {rot:0,pulse:false}}
function radarKey(a){return a.hex||a.flight||`${a.lat},${a.lon}`}
function pruneTracks(){const cutoff=Date.now()-120000;for(const k of Object.keys(state.tracks)){state.tracks[k]=state.tracks[k].filter(p=>p.t>=cutoff);if(!state.tracks[k].length)delete state.tracks[k];}}
function radarPos(ac, radiusKm){const r=Math.min(1,Math.max(0,(ac.distance||0)/(radiusKm||50)));const ang=(ac.bearing||0)*Math.PI/180;return {x:110+Math.sin(ang)*86*r,y:110-Math.cos(ang)*86*r}}
function updateRadarHistory(list,radiusKm){const now=Date.now();pruneTracks();(list||[]).slice(0,3).forEach(ac=>{const k=radarKey(ac);const pos=radarPos(ac,radiusKm);if(!state.tracks[k])state.tracks[k]=[];const last=state.tracks[k][state.tracks[k].length-1];if(!last||Math.hypot(last.x-pos.x,last.y-pos.y)>1.5)state.tracks[k].push({...pos,t:now});state.tracks[k]=state.tracks[k].filter(p=>p.t>=now-120000).slice(-36);});}
function renderMiniRadar(list,radiusKm){const svg=$('miniRadar'); if(!svg)return; updateRadarHistory(list,radiusKm); let h='';h+=`<circle class="radarRing" cx="110" cy="110" r="96"></circle><circle class="radarRing" cx="110" cy="110" r="62" opacity=".45"></circle><path class="radarCross" d="M110 20v180M20 110h180"></path><circle class="radarDot" cx="110" cy="110" r="4.5"></circle>`;(list||[]).slice(0,3).forEach((ac,i)=>{const k=radarKey(ac);const pts=(state.tracks[k]||[]).map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');if(pts)h+=`<polyline class="radarTrail" points="${pts}"></polyline>`;const p=radarPos(ac,radiusKm);const rot=ac.track||ac.bearing||0;const label=(ac.flight||ac.hex||'').slice(0,7);h+=`<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rot})"><path class="radarPlane ${i===0?'primary':''}" d="M0,-9 L5,7 L0,4 L-5,7 Z"></path></g>`;h+=`<text class="radarLabel" x="${p.x.toFixed(1)}" y="${(p.y+18).toFixed(1)}">${label}</text>`;});svg.innerHTML=h;}

async function render(ac,next=[]){
  $('noData').style.display=ac?'none':'block';
  $('aircraftData').style.display=ac?'block':'none';
  if(!ac){$('status').textContent='No aircraft found';return}
  $('routeText').textContent=(await resolveRoute(ac))||'Flight';
  $('flightCode').textContent=ac.flight||ac.hex||'UNKNOWN';
  $('typeReg').textContent=[ac.type||'Aircraft',ac.reg].filter(Boolean).join(' • ');
  $('distance').textContent=isFinite(ac.distance)?(Number(ac.distance).toFixed(Number(ac.distance)<10?1:0)):'--';
  $('altitude').textContent=isFinite(ac.alt)?Math.round(ac.alt).toLocaleString('en-US'):'--';
  $('speed').textContent=isFinite(ac.speed)?Math.round(ac.speed):'--';
  $('compassText').textContent=dir(ac.bearing);
  $('compassNeedle').style.transform=`rotate(${(ac.bearing||0)-90}deg)`;
  const tr=trend(ac);
  $('climbArrow').style.setProperty('--rot',`${tr.rot}deg`);
  $('climbArrow').style.transform=`rotate(${tr.rot}deg)`;
  $('climbArrow').classList.toggle('pulse',tr.pulse);
  const nxt=next.slice(0,2).map(x=>`${x.flight||x.hex} ${x.distance.toFixed(1)} km`).join('  |  ');
  $('nextNearby').textContent=nxt;

  const code=(ac.airline||'AIR').slice(0,3);
  const iata=(ICAO_TO_IATA[code]||code.slice(0,2)||'--').toUpperCase();
  $('airlineCode').textContent=iata;
  const showFallback=()=>{
    $('airlineLogo').style.display='none';
    $('airlineFallback').style.display='block';
    $('airlineFallback').textContent=iata;
  };
  const logo=await resolveLogo(code);
  if(logo){
    $('airlineFallback').style.display='none';
    $('airlineLogo').style.display='block';
    $('airlineLogo').onerror=showFallback;
    $('airlineLogo').src=logo;
  }else showFallback();

  const photo=await getPhoto(ac);
  if(photo){$('bgPhoto').style.backgroundImage=`url('${photo}')`;$('bgPhoto').classList.add('visible')}
  else{$('bgPhoto').classList.remove('visible')}

  state.diag={...state.diag,aircraft:ac.type||'--',reg:ac.reg||'--',hex:ac.hex||'--',airline:code,logo:logo?'FOUND':'NOT FOUND',photo:photo?'FOUND':'NOT FOUND'};
  updateDiagnostics();
  $('status').textContent=`Updated ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}`
}
function updateDiagnostics(){
  const d=state.diag||{};
  const set=(id,val)=>{const el=$(id); if(el)el.textContent=val||'--'};
  set('diagAircraft',d.aircraft); set('diagReg',d.reg); set('diagHex',d.hex); set('diagAirline',d.airline); set('diagLogo',d.logo); set('diagPhoto',d.photo); set('diagRoute',d.route);
}
async function updateWeather(s){try{const r=await fetch(`/api/weather?lat=${s.lat}&lon=${s.lon}`);const j=await r.json();$('weather').textContent=isFinite(j.temperature)?`${Math.round(j.temperature)}°C`:'--°C';$('wind').textContent=isFinite(j.wind)?`${Math.round(j.wind)} km/h`:'-- km/h'}catch(e){}}
async function update(){const s=settings();let loc={lat:Number(s.lat),lon:Number(s.lon)};if(s.locationSource==='gps'&&navigator.geolocation){try{loc=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(p=>res({lat:p.coords.latitude,lon:p.coords.longitude}),rej,{enableHighAccuracy:true,timeout:5000,maximumAge:30000}))}catch(e){}}
 await updateWeather(loc);try{const nm=(Number(s.radius)||50)*0.539957;const r=await fetch(`/api/aircraft?lat=${loc.lat}&lon=${loc.lon}&dist=${nm.toFixed(1)}`);const j=await r.json();const list=(j.aircraft||j.ac||[]).map(x=>norm(x)).filter(x=>isFinite(x.lat)&&isFinite(x.lon)).map(x=>({...x,distance:distKm(loc.lat,loc.lon,x.lat,x.lon),bearing:bearing(loc.lat,loc.lon,x.lat,x.lon)})).sort((a,b)=>a.distance-b.distance);state.aircraft=list;const sorted=[...list].sort((a,b)=>score(a,s.mode)-score(b,s.mode));const primary=sorted[0];const next=list.filter(x=>x!==primary).slice(0,2);renderMiniRadar([primary,...next].filter(Boolean), Number(s.radius)||50);render(primary,next)}catch(e){$('status').textContent='Data error';render(null)}}
function start(){clearInterval(state.timer);update();state.timer=setInterval(update,Number(settings().refresh)||10000)}
function tickClock(){$('clock').textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}setInterval(tickClock,1000);tickClock();
function loadSettings(){const s=settings();['lat','lon','radius','refresh','mode','locationSource','routeProvider','routeApiKey'].forEach(id=>{if($(id))$(id).value=s[id]||''});$('photos').checked=!!s.photos}
$('openSettings').onclick=()=>{loadSettings();$('settingsOverlay').classList.add('open')};$('closeSettings').onclick=()=>$('settingsOverlay').classList.remove('open');$('settingsOverlay').addEventListener('click',e=>{if(e.target.id==='settingsOverlay')$('settingsOverlay').classList.remove('open')});$('saveSettings').onclick=()=>{saveSettings({lat:Number($('lat').value),lon:Number($('lon').value),radius:Number($('radius').value),refresh:Number($('refresh').value),mode:$('mode').value,locationSource:$('locationSource').value,photos:$('photos').checked,routeProvider:$('routeProvider').value,routeApiKey:$('routeApiKey').value});$('settingsOverlay').classList.remove('open');start()};
if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});start();
