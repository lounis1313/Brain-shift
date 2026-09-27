const CACHE="brain-shift-v1.4.0";
const ASSETS=["./","./index.html","./styles.css","./pro.css","./reactor.css","./app.js","./pro.js","./reactor.js","./manifest.webmanifest","./assets/icon-192.png","./assets/icon-512.png","./assets/maskable-512.png","./assets/audio/tap.mp3","./assets/audio/correct.mp3","./assets/audio/wrong.mp3","./assets/audio/combo.mp3","./assets/audio/reward.mp3","./assets/audio/badge.mp3","./assets/audio/record.mp3","./assets/audio/level.mp3","./assets/audio/start.mp3","./assets/audio/finish.mp3"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request).catch(()=>caches.match("./index.html")));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }))
  );
});

self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
