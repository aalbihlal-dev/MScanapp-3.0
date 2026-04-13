var CACHE='module-scanner-v21';
var URLS=['/','/index.html'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(URLS)}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}));self.clients.claim()});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  /* Network-first for HTML — ensures app updates always pull through.
     Falls back to cache when offline (the whole point of the SW). */
  if(e.request.mode==='navigate'||u.pathname==='/'||u.pathname==='/index.html'){
    e.respondWith(
      fetch(e.request).then(function(r){
        if(r.ok){var rc=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,rc)})}
        return r;
      }).catch(function(){return caches.match(e.request)})
    );
    return;
  }
  /* Cache-first for other assets */
  e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request)}));
});
