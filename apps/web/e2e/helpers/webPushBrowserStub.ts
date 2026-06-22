import type { Page } from '@playwright/test';

/**
 * Playwright Chromium cannot complete real PushManager.subscribe against a service worker.
 * Stub registration + subscription so bucket bell E2E exercises API preference toggles only.
 */
export async function installWebPushBrowserStub(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (typeof Notification !== 'undefined') {
      Notification.requestPermission = async () => 'granted';
    }

    let currentSub: {
      endpoint: string;
      toJSON: () => { endpoint: string; keys: { p256dh: string; auth: string } };
      unsubscribe: () => Promise<boolean>;
    } | null = null;

    const endpoint = 'https://example.invalid/e2e-webpush-endpoint';

    const createSubscription = () => ({
      endpoint,
      toJSON() {
        return {
          endpoint,
          keys: {
            p256dh: 'BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            auth: 'authkey123456',
          },
        };
      },
      unsubscribe: async () => {
        currentSub = null;
        return true;
      },
    });

    const mockRegistration = {
      pushManager: {
        subscribe: async () => {
          currentSub = createSubscription();
          return currentSub;
        },
        getSubscription: async () => currentSub,
      },
    };

    navigator.serviceWorker.register = async () => mockRegistration;
    Object.defineProperty(navigator.serviceWorker, 'ready', {
      configurable: true,
      get: () => Promise.resolve(mockRegistration),
    });
  });
}
