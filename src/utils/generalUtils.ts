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
