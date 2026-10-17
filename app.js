'use strict';
const $=id=>document.getElementById(id);
const colors={critical:'#ef6868',high:'#ef6868',moderate:'#f6b866',low:'#52b8dc',unrated:'#b49bff'};
const map=L.map('map',{worldCopyJump:true,zoomControl:false}).setView([18,10],2);
L.control.zoom({position:'bottomright'}).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap contributors &copy; CARTO',maxZoom:18}).addTo(map);
const markers=L.layerGroup().addTo(map);let all=[];
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const category=x=>String(x.category||'Other').split(',')[0];
const stamp=s=>{const d=new Date(s);return Number.isNaN(d.getTime())?'Unknown':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' UTC'};
const url=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch{return '#'}};
function draw(){
 const q=$('search').value.trim().toLowerCase(),cat=$('category').value,sev=$('severity').value;
 const items=all.filter(x=>(cat==='all'||category(x)===cat)&&(sev==='all'||x.severity===sev)&&(!q||[x.title,x.category,x.details,x.source].some(v=>String(v||'').toLowerCase().includes(q))));
 $('result-count').textContent=items.length.toLocaleString();markers.clearLayers();
 const list=$('events');list.replaceChildren();
 if(!items.length){list.innerHTML='<div class="empty">No matching events. Check filters or data source status.</div>';return;}
 const frag=document.createDocumentFragment();
 for(const x of items){
  const marker=L.circleMarker([x.lat,x.lon],{radius:x.severity==='critical'?9:6,color:'#0e1520',weight:1.5,fillColor:colors[x.severity]||colors.unrated,fillOpacity:.88}).addTo(markers);
  marker.bindPopup('<b>'+escapeHtml(x.title)+'</b><br>'+escapeHtml(category(x))+' · '+escapeHtml(x.severity)+'<br>'+escapeHtml(x.details)+'<br>'+escapeHtml(stamp(x.time))+'<br><a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(url(x.url))+'">Original source ↗</a>');
  const row=document.createElement('article');row.className='event';row.tabIndex=0;row.setAttribute('role','button');
  row.innerHTML='<div class="event-top"><span class="category">'+escapeHtml(category(x))+'</span><span class="severity '+escapeHtml(x.severity)+'">'+escapeHtml(x.severity)+'</span></div><h3>'+escapeHtml(x.title)+'</h3><div class="event-meta">'+escapeHtml(stamp(x.time))+' · '+escapeHtml(x.source)+'</div>';
  const show=()=>{map.flyTo([x.lat,x.lon],Math.max(map.getZoom(),5),{duration:.7});marker.openPopup();if(innerWidth<1100)$('map').scrollIntoView({behavior:'smooth',block:'center'})};
  row.addEventListener('click',show);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}});frag.appendChild(row);
 }
 list.appendChild(frag);
}
function render(data){
 all=(Array.isArray(data.alerts)?data.alerts:[]).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&Math.abs(x.lat)<=90&&Math.abs(x.lon)<=180).sort((a,b)=>new Date(b.time)-new Date(a.time));
 $('total').textContent=all.length.toLocaleString();$('quakes').textContent=all.filter(x=>x.source==='USGS').length.toLocaleString();$('natural').textContent=all.filter(x=>x.source==='NASA EONET').length.toLocaleString();
 $('high').textContent=all.filter(x=>x.source==='USGS'&&['critical','high'].includes(x.severity)).length.toLocaleString();
 $('updated').textContent=data.generatedAt?stamp(data.generatedAt):'No collection yet';
 const cats=[...new Set(all.map(category))].sort(),previous=$('category').value;
 $('category').replaceChildren(new Option('All categories','all'),...cats.map(x=>new Option(x,x)));$('category').value=cats.includes(previous)?previous:'all';
 let failures=0;for(const k of ['usgs','nasa']){const el=$(k+'-status'),s=(data.sources||{})[k];el.classList.remove('ok','fail');if(s){el.classList.add(s.ok?'ok':'fail');el.querySelector('.source-state').textContent=s.ok?'Updated':'Stale';if(!s.ok)failures++}else{el.querySelector('.source-state').textContent='No data';failures++}}
 $('freshness').textContent=failures?'● PARTIAL / STALE':'● FEEDS ONLINE';$('freshness').style.color=failures?'#f3b35c':'#58dbad';draw();
}
async function load(){try{const r=await fetch('data/alerts.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);render(await r.json())}catch(e){$('freshness').textContent='● DATA UNAVAILABLE';$('freshness').style.color='#ef6868';$('events').innerHTML='<div class="empty">Unable to load data. Inspect GitHub Actions.</div>';console.error(e)}}
$('search').addEventListener('input',draw);$('category').addEventListener('change',draw);$('severity').addEventListener('change',draw);$('refresh').addEventListener('click',load);
function tick(){$('utc').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'})+' UTC'}tick();setInterval(tick,30000);load();setInterval(load,60000);
