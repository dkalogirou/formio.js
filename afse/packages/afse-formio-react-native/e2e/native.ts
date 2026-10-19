import { expect, type Page } from '@playwright/test';
import { HOST_HTML } from '../src/generated/host-html';
import { encode, decode, type FromHost, type HostConfig, type ToHost } from '../src/protocol';

/** Plays the React Native side of the bridge against the real form page. */
export class NativeSide {
  private nextId = 1;

  constructor(readonly page: Page) {}

  static async open(page: Page, config: Partial<HostConfig> & Pick<HostConfig, 'form'>) {
    await page.addInitScript(() => {
      const w = window as unknown as { __received: string[]; ReactNativeWebView: { postMessage(m: string): void } };
      w.__received = [];
      w.ReactNativeWebView = { postMessage: (m) => w.__received.push(m) };
    });
    // Served like the WebView does: the inlined page, no other requests.
    await page.route('https://app.afse.test/**', (route) => route.fulfill({ body: HOST_HTML, contentType: 'text/html' }));
    await page.goto('https://app.afse.test/form');
    const native = new NativeSide(page);
    await native.waitFor('boot');
    await native.send({ type: 'configure', config: { ...DEFAULTS, ...config } });
    await native.waitFor('ready');
    return native;
  }

  async send(message: ToHost) {
    await this.page.evaluate((raw) => window.__afseReceive?.(raw), encode(message));
  }

  async messages(): Promise<FromHost[]> {
    const raw = await this.page.evaluate(() => (window as unknown as { __received: string[] }).__received);
    return raw.map((m) => decode<FromHost>(m)).filter((m): m is FromHost => m !== null);
  }

  async waitFor<T extends FromHost['type']>(type: T, predicate: (m: Extract<FromHost, { type: T }>) => boolean = () => true) {
    let found: Extract<FromHost, { type: T }> | undefined;
    await expect
      .poll(async () => {
        found = (await this.messages()).filter((m): m is Extract<FromHost, { type: T }> => m.type === type).reverse().find(predicate);
        return Boolean(found);
      }, { message: `waiting for "${type}" from the page` })
      .toBe(true);
    return found!;
  }

  /** Calls a handle method the way `ref.current.submit()` etc. does. */
  async call(command: Extract<ToHost, { type: 'command' }>['command'], ...args: unknown[]) {
    const id = this.nextId++;
    await this.send({ type: 'command', id, command, args });
    return this.waitFor('result', (m) => m.id === id);
  }
}

const DEFAULTS: Omit<HostConfig, 'form'> = {
  language: 'en',
  readOnly: false,
  summary: false,
  hideSubmitButton: false,
  autoHeight: false,
};
