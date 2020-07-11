import { Page } from 'puppeteer';
import UserAgent from 'user-agents';

export async function setStandardViewPort(page: Page): Promise<void> {
  await page.setViewport({ width: 1848, height: 981 });
}

export async function setRandomUserAgent(page: Page): Promise<void> {
  const userAgent: UserAgent = new UserAgent();
  page.setUserAgent(userAgent.toString());
}

export async function passWebDriverTest(page: Page): Promise<void> {
  await page.evaluateOnNewDocument((): void => {
    const newProto: any = (navigator as any).__proto__;
    delete newProto.webdriver;
    (navigator as any).__proto__ = newProto;
  });
}

export async function passChromeTest(page: Page): Promise<void> {
  await page.evaluateOnNewDocument((): void => {
    (window as any).chrome = {
      runtime: {}
    };
  });
}

export async function passPermissionTest(page: Page): Promise<void> {
  await page.evaluateOnNewDocument((): void => {
    const originalQuery: any = (window.navigator as any).query;

    (window.navigator.permissions as any).__proto__.query = (parameters: any): void => {
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);
    };

    const oldCall: any = Function.prototype.call;

    function call(): any {
      return oldCall.apply(this, arguments);
    }

    Function.prototype.call = call;

    const nativeToStringFunctionString: string = Error.toString().replace(/Error/g, 'toString');
    const oldToString: () => string = Function.prototype.toString;

    function functionToString(): any {
      if (this === window.navigator.permissions.query) {
        return 'function query() { [native code] }';
      }

      if (this === functionToString) {
        return nativeToStringFunctionString;
      }

      return oldCall.call(oldToString, this);
    }

    Function.prototype.toString = functionToString;
  });
}

export async function passPluginsLengthTest(page: Page): Promise<void> {
  await page.evaluateOnNewDocument((): void => {
    Object.defineProperty(navigator, 'plugins', {
      get: (): number[] => [1, 2, 3, 4, 5]
    });
  });
}

export async function passLanguagesTest(page: Page): Promise<void> {
  await page.evaluateOnNewDocument((): void => {
    Object.defineProperty(navigator, 'languages', {
      get: (): string[] => ['pt-BR', 'pt']
    });
  });
}

export async function passIframeTest(page: Page): Promise<void> {
  await page.evaluateOnNewDocument((): void => {
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get: (): any => window
    });
  });
}

export async function passToStringTest(page: Page): Promise<void> {
  await page.evaluateOnNewDocument((): void => {
    window.console.debug = (): null => null;
  });
}

export async function enableStealthMode(page: Page): Promise<void> {
  await setStandardViewPort(page);
  await setRandomUserAgent(page);
  // await passWebDriverTest(page);
  // await passChromeTest(page);
  // await passPermissionTest(page);
  // await passPluginsLengthTest(page);
  // await passLanguagesTest(page);
  // await passToStringTest(page);
}
