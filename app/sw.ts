import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { BackgroundSyncQueue, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Change this attribute's name to your `injectionPoint`.
    // `injectionPoint` is an InjectManifest option.
    // See https://serwist.pages.dev/docs/build/configuring
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

const queue = new BackgroundSyncQueue("myTxs");

const putInCache = async (request: any, response: any) => {
  const cache = await caches.open("v1");
  await cache.put(request, response);
};

const networkFirst = async ({ request, fallbackUrl }: any) => {
  try {
    const responseFromNetwork = await fetch(request);
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    return new Response("Network error", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

// Handle fetch events
self.addEventListener("fetch", (event) => {
  // console.log("fetch", event);
  event.respondWith(
    networkFirst({
      request: event.request,
      fallbackUrl: "/fallback.html",
    })
  );
});

const updateTxs = async () => {
  await fetch(
    "https://btcscan.org/api/address/bc1qxhmdufsvnuaaaer4ynz88fspdsxq2h9e9cetdj/txs"
  );
};

self.addEventListener("periodicSync", (event: any) => {
  console.log("periodicSync", event);
  if (event.tag === "update-txs") {
    event.waitUntil(updateTxs());
  }
});

serwist.addEventListeners();
