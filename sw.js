/* MERIDIAN PWA offline shell. Real-time hazard data is NEVER cached here. */
'use strict';
const VERSION='meridian-pwa-v1';
const ASSETS=['./','./index.html','./styles.css?v=pwa1','./app.js?v=pwa1','./pwa.js?v=pwa1','./manifest.webmanifest','./favicon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./offline.html'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('meridian-pwa-')&&n!==VERSION).map(n=>caches.delete(n)));await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;
 const u=new URL(req.url);
 // Never intercept external hazard feeds, map tiles or the JSON backup.
 if(u.origin!==self.location.origin||u.pathname.includes('/data/')||u.pathname.includes('/api/'))return;
 if(req.mode==='navigate'){
  e.respondWith((async()=>{
    try{const response=await fetch(req);if(response.ok){const c=await caches.open(VERSION);await c.put('./index.html',response.clone())}return response}
    catch{return await caches.match('./index.html')||await caches.match('./offline.html')||Response.error()}
  })());return;
 }
 if(/\.(?:css|js|png|svg|webmanifest)$/.test(u.pathname)){
  e.respondWith((async()=>{
    const hit=await caches.match(req);if(hit)return hit;
    const response=await fetch(req);
    if(response.ok){const c=await caches.open(VERSION);c.put(req,response.clone()).catch(()=>{})}
    return response
  })())
 }
});
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});
