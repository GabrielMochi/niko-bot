import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';
import logger from '../config/logger';

const isDebugging: boolean = process.env.NODE_ENV === 'development';

export async function start(): Promise<void> {
  try {
    const browser: Browser = await puppeteer.launch({ headless: !isDebugging });
    const page: Page = await browser.newPage();

    await page.goto(process.env.NIKE_SITE);

    const produtos: ElementHandle[] = await page.$$(
      '#DadosPaginacaoCalendario ' +
      '.box-resultados ' +
      '.snkr-release.produto.produto--aviseme'
    );

  } catch (err) {
    logger.error(`[ENGINE]: ${err}`);
  }
}
