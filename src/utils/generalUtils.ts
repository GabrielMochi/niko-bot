import { ElementHandle } from 'puppeteer-core';
import HTMLValueElement from '../interfaces/HTMLValueElement';
import Resolve from '../interfaces/Resolve';

/**
 * @param timeout milliseconds
 */
export function wait(timeout: number): Promise<void> {
  return new Promise<void>((resolve: Resolve): void => {
    setTimeout(resolve, timeout);
  });
}

export function standardizeUrl(url: string): string {
  return url.toLowerCase().replace(/\/$/g, '');
}

export async function insertValueLikeTyping<T extends HTMLValueElement>(
  element: ElementHandle,
  valueToBeInserted: string,
  timeout: number = 250
): Promise<void> {
  await element.evaluate((el: T): void => el.focus());
  await element.evaluate((el: T): void => { el.value = ''; });

  for (const character of valueToBeInserted) {
    await element.evaluate(
      (el: T, insertedChar: string): void => { el.value += insertedChar; },
      character
    );

    await wait(timeout);
  }
}
