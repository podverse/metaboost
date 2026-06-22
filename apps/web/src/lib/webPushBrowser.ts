import { webAuth } from '@metaboost/helpers-requests';

import { getApiBaseUrl } from '../config/env';

const SW_SCRIPT = '/webpush-sw.js';

/** Decode VAPID public key for PushManager.subscribe. */
export function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(SW_SCRIPT);
}

export async function subscribeWithVapid(vapidPublicKey: string): Promise<PushSubscription> {
  const registration = await registerWebPushServiceWorker();
  await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  return sub;
}

export function subscriptionBodyFromPushSubscription(sub: PushSubscription): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  const j = sub.toJSON();
  const endpoint = j.endpoint;
  const keys = j.keys;
  if (
    endpoint === undefined ||
    keys === undefined ||
    typeof keys.p256dh !== 'string' ||
    typeof keys.auth !== 'string'
  ) {
    throw new Error('Invalid PushSubscription JSON');
  }
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

export async function unsubscribeCurrentBrowserPush(): Promise<string | null> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub === null) {
    return null;
  }
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

export async function deleteServerSubscriptionIfMatches(endpoint: string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const list = await webAuth.reqListWebPushSubscriptions(baseUrl, {});
  if (!list.ok || list.data === undefined) {
    return;
  }
  const match = list.data.subscriptions.find((s) => s.endpoint === endpoint);
  if (match !== undefined) {
    await webAuth.reqDeleteWebPushSubscription(baseUrl, match.id, {});
  }
}
