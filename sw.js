// 当前缓存版本的唯一标识符
var cacheKey = _sw.hash;

// 需要被缓存的文件的 URL 列表
var cacheFileList = _sw.assets;

// 监听 install 事件
self.addEventListener('install', function (event) {
  // 等待所有资源缓存完成时，才可以进行下一步
  event.waitUntil(
    caches.open(cacheKey).then(function (cache) {
      // 要缓存的文件 URL 列表
      return cache.addAll(cacheFileList);
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', function (event) {
  event.respondWith(
    // 去缓存中查询对应的请求
    caches.match(event.request).then(function (response) {
        // 如果命中本地缓存，就直接返回本地的资源
        if (response) {
          return response;
        }
        // 否则就去用 fetch 下载资源
        return fetch(event.request);
      }
    )
  );
});

// 当sw.js文件更新时，新 Service Workers 线程会取得控制权，将会触发其 activate 事件
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          // 不为cacheKey的缓存全部清理掉
          if (cacheKey !== cacheName) {
            // 删除缓存
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
