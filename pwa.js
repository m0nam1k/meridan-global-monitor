/* MERIDIAN — install flow, bookmarks, and network-state UI. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const KEY='meridian.saved.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'#'}catch{return '#'}};
let saved={},records=[],installPrompt=null;
try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');if(x&&typeof x==='object'&&!Array.isArray(x))saved=x}catch{}
const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function updateControls(){
 const count=Object.keys(saved).length;
 for(const id of ['saved-count','saved-count-mobile'])if($(id))$(id).textContent=String(count);
 document.querySelectorAll('.save-event').forEach(b=>{
  const active=Boolean(saved[b.dataset.eventId]);
  b.textContent=active?'★':'☆';b.classList.toggle('saved',active);
  b.title=active?'Unsave event':'Save event';b.setAttribute('aria-label',b.title);
 });
 if($('saved-dialog')?.open)renderSaved();
}
function persist(){
 const ids=Object.keys(saved).sort((a,b)=>saved[b].savedAt-saved[a].savedAt);
 for(const id of ids.slice(80))delete saved[id];
 try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{message('Your browser cannot save bookmarks persistently.')}
 updateControls();
}
function addButtons(){
 for(const row of document.querySelectorAll('#events .event')){
  const id=row.dataset.eventId;if(!id||row.querySelector('.save-event'))continue;
  const button=document.createElement('button');
  button.type='button';button.className='save-event';button.dataset.eventId=id;
  row.appendChild(button);
 }
 updateControls();
}
window.addEventListener('meridian:data',e=>{
 records=Array.isArray(e.detail?.alerts)?e.detail.alerts:[];
 addButtons();
});
const feed=$('events');
feed?.addEventListener('click',e=>{
 const b=e.target.closest('.save-event');if(!b)return;
 e.stopPropagation();
 const record=records.find(x=>x.id===b.dataset.eventId);if(!record)return;
 if(saved[record.id])delete saved[record.id];
 else saved[record.id]={id:record.id,title:record.title,source:record.source,category:record.category,url:safeURL(record.url),time:record.time,savedAt:Date.now()};
 persist();
});
const observer=new MutationObserver(()=>addButtons());
if(feed)observer.observe(feed,{childList:true});
function renderSaved(){
 const box=$('saved-list');if(!box)return;
 const items=Object.values(saved).sort((a,b)=>b.savedAt-a.savedAt);
 if(!items.length){box.innerHTML='<p class="saved-empty">No saved events yet. Tap ☆ in the feed to keep a link to the original report.</p>';return}
 box.replaceChildren();
 for(const item of items){
  const row=document.createElement('div');row.className='saved-item';
  const stamp=item.time&&!isNaN(Date.parse(item.time))?new Date(item.time).toLocaleString():'Date unknown';
  row.innerHTML='<div><span>'+esc(item.source)+'</span><h3>'+esc(item.title)+'</h3><p>'+esc(stamp)+'</p></div><div class="saved-actions"><a href="'+esc(safeURL(item.url))+'" target="_blank" rel="noopener noreferrer" aria-label="Open original report">↗</a><button type="button" data-remove-id="'+esc(item.id)+'" aria-label="Remove saved event">×</button></div>';
  box.appendChild(row);
 }
}
const dlg=$('saved-dialog');
function openSaved(){renderSaved();if(dlg?.showModal)dlg.showModal();else dlg?.setAttribute('open','')}
$('saved-open')?.addEventListener('click',openSaved);
$('saved-open-mobile')?.addEventListener('click',openSaved);
$('saved-close')?.addEventListener('click',()=>dlg?.close());
dlg?.addEventListener('click',e=>{
 if(e.target===dlg){dlg.close();return}
 const b=e.target.closest('[data-remove-id]');if(!b)return;
 delete saved[b.dataset.removeId];persist();
});
function message(s){const el=$('pwa-message');if(el){el.textContent=s;el.hidden=false}}
function refreshNetwork(){
 const offline=!navigator.onLine,el=$('offline-banner');
 if(el)el.hidden=!offline;
 document.body.classList.toggle('offline',offline);
}
window.addEventListener('online',refreshNetwork);
window.addEventListener('offline',refreshNetwork);
refreshNetwork();
const install=$('install-button');
function installState(){if(install)install.hidden=installed();document.body.classList.toggle('is-standalone',installed())}
installState();
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event});
window.addEventListener('appinstalled',()=>{installPrompt=null;installState();message('MERIDIAN was installed.')});
install?.addEventListener('click',async()=>{
 if(installPrompt){const event=installPrompt;installPrompt=null;try{await event.prompt()}catch{message('Open your browser menu to install MERIDIAN.')}return}
 const help=$('install-help');if(help){help.hidden=false;help.scrollIntoView({block:'nearest',behavior:'smooth'})}
});
$('install-close')?.addEventListener('click',()=>{$('install-help').hidden=true});
function activeNav(){
 document.querySelectorAll('.mobile-dock a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===(location.hash||'#overview')));
}
window.addEventListener('hashchange',activeNav);activeNav();
if('serviceWorker' in navigator && location.protocol==='https:'){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
  reg.addEventListener('updatefound',()=>{
   const candidate=reg.installing;if(!candidate)return;
   candidate.addEventListener('statechange',()=>{
    if(candidate.state==='installed'&&navigator.serviceWorker.controller)$('update-banner').hidden=false;
   });
  });
 }).catch(e=>{console.warn('PWA worker unavailable',e);message('Offline app support could not be installed, but live data may still work.')}))
}
$('update-now')?.addEventListener('click',async()=>{
 try{
  const reg=await navigator.serviceWorker.getRegistration('./');
  if(!reg?.waiting){location.reload();return}
  navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
  reg.waiting.postMessage({type:'SKIP_WAITING'});
 }catch{location.reload()}
});
updateControls();
})();
