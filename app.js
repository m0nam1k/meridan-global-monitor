(() => {
'use strict';
const $=id=>document.getElementById(id);
const colors={critical:'#ef6868',high:'#ef6868',moderate:'#f6b866',low:'#52b8dc',unrated:'#b49bff'};
const specs={
 usgs:{url:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',interval:30000,label:'USGS',parse:usgs},
 nasa:{url:'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=500&days=30',interval:120000,label:'NASA EONET',parse:nasa},
 noaa:{url:'https://api.weather.gov/alerts/active',interval:60000,label:'NOAA NWS',parse:noaa}
};
const state=Object.fromEntries(Object.keys(specs).map(k=>[k,{alerts:[],status:'waiting',attempt:0,next:0,success:0,busy:false,error:''}]));
let all=[],initial=true;const seen=new Set(),newEvents=new Set();
const map=L.map('map',{worldCopyJump:true,zoomControl:false,preferCanvas:true}).setView([18,10],2);
L.control.zoom({position:'bottomright'}).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',maxNativeZoom:19,maxZoom:19}).addTo(map);
const markers=L.layerGroup().addTo(map);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'#';}catch{return '#';}};
const cat=x=>String(x.category||'Other').split(',')[0];
const fmt=s=>{const d=new Date(s);return Number.isNaN(d.getTime())?'Unknown':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' UTC';};
const located=x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&Math.abs(x.lat)<=90&&Math.abs(x.lon)<=180;
const point=c=>Array.isArray(c)&&c.length>=2&&Number.isFinite(c[0])&&Number.isFinite(c[1])?{lat:c[1],lon:c[0]}:{lat:null,lon:null};
function locate(g){
 if(!g)return {lat:null,lon:null};
 if(g.type==='Point')return point(g.coordinates);
 const ring=g.type==='Polygon'?g.coordinates?.[0]:g.type==='MultiPolygon'?g.coordinates?.[0]?.[0]:null;
 if(!Array.isArray(ring))return {lat:null,lon:null};
 const c=ring.filter(a=>Array.isArray(a)&&Number.isFinite(a[0])&&Number.isFinite(a[1]));
 if(!c.length)return {lat:null,lon:null};
 return {lat:(Math.min(...c.map(v=>v[1]))+Math.max(...c.map(v=>v[1])))/2,lon:(Math.min(...c.map(v=>v[0]))+Math.max(...c.map(v=>v[0])))/2};
}
function usgs(d){
 if(!Array.isArray(d.features))throw Error('Invalid USGS response');
 return d.features.map(f=>{
 const p=f.properties||{},c=f.geometry?.coordinates||[],pos=point(c),m=Number(p.mag);
 if(!located(pos)||!Number.isFinite(m))return null;
 return {id:'usgs:'+f.id,title:p.title||'Earthquake',category:'Earthquake',severity:m>=6?'critical':m>=5?'high':m>=4?'moderate':'low',...pos,time:p.time?new Date(p.time).toISOString():null,source:'USGS',url:p.url||'https://earthquake.usgs.gov/',details:'Magnitude '+m.toFixed(1)+(Number.isFinite(c[2])?' · Depth '+Number(c[2]).toFixed(1)+' km':'')};
 }).filter(Boolean);
}
function nasa(d){
 if(!Array.isArray(d.events))throw Error('Invalid NASA response');
 return d.events.map(e=>{
 const geoms=Array.isArray(e.geometry)?e.geometry:[],g=geoms.reduce((a,b)=>!a||String(b.date||'')>String(a.date||'')?b:a,null);
 if(!g)return null;const pos=locate({type:g.type,coordinates:g.coordinates});if(!located(pos))return null;
 return {id:'nasa:'+e.id,title:e.title||'Natural event',category:e.categories?.map(c=>c.title).join(', ')||'Natural event',severity:'unrated',...pos,time:g.date||null,source:'NASA EONET',url:e.link||'https://eonet.gsfc.nasa.gov/',details:e.description||'Open natural event. No severity rating supplied.'};
 }).filter(Boolean);
}
function noaa(d){
 if(!Array.isArray(d.features))throw Error('Invalid NOAA response');
 return d.features.map(f=>{
 const p=f.properties||{},pos=locate(f.geometry),severity={Extreme:'critical',Severe:'high',Moderate:'moderate',Minor:'low'}[p.severity]||'unrated';
 return {id:'noaa:'+String(f.id||p.id||p.headline),title:p.headline||p.event||'Weather warning',category:'Weather',severity,...pos,time:p.sent||p.effective||p.onset||null,source:'NOAA NWS',url:p.web||p['@id']||f.id||'https://www.weather.gov/',details:[p.event,p.areaDesc].filter(Boolean).join(' · ').slice(0,300),note:located(pos)?'Point is approximate; consult the source for affected area':'Source has no geographic point'};
 }).filter(x=>x.id&&x.title);
}
async function getJSON(url){
 const controller=new AbortController(),t=setTimeout(()=>controller.abort(),25000);
 try{const r=await fetch(url,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/geo+json,application/json;q=0.9,*/*;q=0.5'}});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(t);}
}
function draw(){
 const query=$('search').value.trim().toLowerCase(),category=$('category').value,severity=$('severity').value;
 const hours=$('time-range')?.value||'all',now=Date.now();
 const matches=all.filter(x=>(category==='all'||cat(x)===category)&&(severity==='all'||x.severity===severity)&&(!query||[x.title,x.details,x.source,x.category].some(v=>String(v||'').toLowerCase().includes(query)))&&(hours==='all'||(Number.isFinite(Date.parse(x.time))&&Date.parse(x.time)<=now+300000&&now-Date.parse(x.time)<=Number(hours)*3600000)));
 $('result-count').textContent=matches.length.toLocaleString();markers.clearLayers();
 const panel=$('events');panel.replaceChildren();
 if(!matches.length){panel.innerHTML='<div class="empty">No matching alerts. Try another filter or check source status.</div>';return;}
 for(const x of matches){
 if(!located(x))continue;
 const marker=L.circleMarker([x.lat,x.lon],{radius:x.severity==='critical'?9:6,color:'#0e1520',weight:1.5,fillColor:colors[x.severity]||colors.unrated,fillOpacity:.88}).addTo(markers);
 x._marker=marker;
 marker.bindPopup('<b>'+escapeHTML(x.title)+'</b><br>'+escapeHTML(cat(x))+' · '+escapeHTML(x.severity)+'<br>'+escapeHTML(x.details)+(x.note?'<br>'+escapeHTML(x.note):'')+'<br>'+escapeHTML(fmt(x.time))+'<br><a target="_blank" rel="noopener noreferrer" href="'+escapeHTML(safeURL(x.url))+'">Open source ↗</a>');
 }
 const frag=document.createDocumentFragment(),visible=matches.slice(0,350);
 for(const x of visible){
 const row=document.createElement('article');row.className='event'+(newEvents.has(x.id)?' is-new':'');row.tabIndex=0;row.setAttribute('role','button');row.dataset.eventId=x.id;
 row.innerHTML='<div class="event-top"><span class="category">'+escapeHTML(cat(x))+'</span><span class="severity '+escapeHTML(x.severity)+'">'+escapeHTML(x.severity)+'</span></div><h3>'+escapeHTML(x.title)+'</h3><div class="event-meta">'+escapeHTML(fmt(x.time))+' · '+escapeHTML(x.source)+(located(x)?'':' · Not mapped')+(newEvents.has(x.id)?' · NEW':'')+'</div>';
 const action=()=>{if(located(x)&&x._marker){map.flyTo([x.lat,x.lon],Math.max(map.getZoom(),5),{duration:.7});x._marker.openPopup();if(window.innerWidth<1100)$('map').scrollIntoView({behavior:'smooth',block:'center'});}else{const u=safeURL(x.url);if(u!=='#')window.open(u,'_blank','noopener,noreferrer');}};
 row.addEventListener('click',action);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}});frag.appendChild(row);
 }
 if(matches.length>visible.length){const note=document.createElement('div');note.className='empty';note.textContent='Showing '+visible.length+' newest of '+matches.length+'. Filter to find older alerts.';frag.appendChild(note);}
 panel.appendChild(frag);
}
function render(){
 const unique=new Set();
 all=Object.values(state).flatMap(s=>s.alerts).filter(x=>x&&x.id).sort((a,b)=>(Date.parse(b.time)||0)-(Date.parse(a.time)||0)).filter(x=>!unique.has(x.id)&&unique.add(x.id));
 $('total').textContent=all.length.toLocaleString();$('quakes').textContent=state.usgs.alerts.length.toLocaleString();$('natural').textContent=state.nasa.alerts.length.toLocaleString();$('weather').textContent=state.noaa.alerts.length.toLocaleString();
 $('high').textContent=all.filter(x=>['critical','high'].includes(x.severity)).length.toLocaleString();
 const cats=[...new Set(all.map(cat))].sort(),selector=$('category'),old=selector.value;
 selector.replaceChildren(new Option('All categories','all'),...cats.map(c=>new Option(c,c)));
 selector.value=cats.includes(old)?old:'all';
 const live=Object.values(state).filter(s=>s.status==='online').length;
 $('freshness').textContent=live===3?'● LIVE · 3/3 SOURCES':live?'● PARTIAL LIVE · '+live+'/3':'● CONNECTING / OFFLINE';
 $('freshness').style.color=live===3?'#58dbad':live?'#f3b35c':'#ef6868';
 const last=Math.max(...Object.values(state).map(s=>s.success));
 $('updated').textContent=last?fmt(last):'Awaiting live feeds';
 for(const k of Object.keys(specs)){
 const el=$(k+'-status'),s=state[k];el.classList.remove('ok','fail');el.classList.add(s.status==='online'?'ok':'fail');
 el.querySelector('.source-state').textContent=s.busy?'Checking…':s.status==='online'?'Live':s.status==='error'?'Offline':'Waiting';
 el.title=s.error?'Error: '+s.error:s.success?'Last checked: '+fmt(s.success):'Awaiting live data';
 }
 draw();
 window.MERIDIAN_ALERTS=all;
 window.dispatchEvent(new CustomEvent('meridian:data',{detail:{alerts:all}}));
}
async function check(key,force=false){
 const s=state[key],cfg=specs[key],now=Date.now();
 if(s.busy||(!force&&now<s.next))return;
 s.busy=true;s.attempt=now;s.next=now+cfg.interval;
 $(key+'-status').querySelector('.source-state').textContent='Checking…';
 try{
 const items=cfg.parse(await getJSON(cfg.url));
 if(!initial)for(const x of items)if(!seen.has(x.id))newEvents.add(x.id);
 items.forEach(x=>seen.add(x.id));
 s.alerts=items;s.status='online';s.error='';s.success=Date.now();
 }catch(e){s.status='error';s.error=e instanceof Error?e.message:String(e);console.warn(cfg.label+' fetch failed:',e);}
 finally{s.busy=false;render();}
}
async function fallback(){
 try{
 const r=await fetch('./data/alerts.json',{cache:'no-store'});if(!r.ok)return;
 const d=await r.json(),src={USGS:'usgs','NASA EONET':'nasa','NOAA NWS':'noaa'};
 for(const x of Array.isArray(d.alerts)?d.alerts:[]){const key=src[x.source];if(key)state[key].alerts.push(x);}
 render();
 }catch(e){console.info('No snapshot available',e);}
}
$('search').addEventListener('input',draw);$('category').addEventListener('change',draw);$('severity').addEventListener('change',draw);$('time-range')?.addEventListener('change',draw);
$('refresh').addEventListener('click',()=>{for(const key of Object.keys(specs))check(key,true);});
function clock(){
 $('utc').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'})+' UTC';
 const waits=Object.values(state).filter(s=>!s.busy).map(s=>Math.max(0,s.next-Date.now()));
 $('next-check').textContent=waits.length?'Next refresh in '+Math.ceil(Math.min(...waits)/1000)+'s':'Fetching…';
}
setInterval(clock,1000);clock();
setInterval(()=>{if(document.hidden)return;for(const key of Object.keys(specs))check(key);},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)for(const key of Object.keys(specs))check(key);});
window.addEventListener('online',()=>{for(const key of Object.keys(specs))check(key);});
(async()=>{await fallback();await Promise.allSettled(Object.keys(specs).map(k=>check(k,true)));initial=false;})();
})();

/* Meridian navigation: active section state for real, available pages only. */
(() => {
  const links=Array.from(document.querySelectorAll('.sidebar-nav a[href^="#"]'));
  const activate=()=>{
    const current=links.find(a=>a.getAttribute('href')===location.hash) || links[0];
    for(const a of links){
      const selected=a===current;
      a.classList.toggle('active',selected);
      if(selected)a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    }
  };
  window.addEventListener('hashchange',activate);
  activate();
})();
