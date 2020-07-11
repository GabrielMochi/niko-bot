import Database from './Database';
import logger from '../config/logger';
import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';
import { Product } from '../models/Product';
import Pool from './Pool';
import ProductThread from './ProductThread';
import Thread from './Thread';
import { CronJob } from 'cron';
import { exec, ExecException } from 'child_process';
import { insertValueLikeTyping } from '../utils/generalUtils';
import Resolve from '../interfaces/Resolve';

class MainThread extends Thread {

  private index: number;
  private pool: Pool;
  private browserUrl: string;
  private browser: Browser;
  private page: Page;
  private mainCronJob: CronJob;
  private productsCronJobs: CronJob[];

  private readonly loggerHead: string;

  public constructor(index: number) {
    super();
    this.index = index;
    this.productsCronJobs = [];
    this.loggerHead = `[#${index}]`;
  }

  public async start(): Promise<void> {
    try {
      logger.info(`${this.loggerHead} 🔥 starting the thread`);

      await Database.loadConnection();
      await this.openBrowserInDebugMode();

      this.pool = new Pool();
      this.browserUrl = `http://${process.env.BROWSER_HOST}:${process.env.BROWSER_PORT}`;

      this.browser = await puppeteer.connect({
        browserURL: this.browserUrl,
        defaultViewport: null
      });

      this.page = await this.browser.newPage();

      await this.page.goto(process.env.NIKE_PRODUCTS_URL);
      await this.loginIfNotLogged();

      this.mainCronJob = new CronJob(
        '0 0 * * * *', // run every hour
        (): Promise<void> => this.refreshScraping(),
        null,
        true
      );

      await this.scrapeProductsPage();
    } catch (err) {
      logger.error(`${this.loggerHead} something went wrong while starting the thread: `);
      logger.error(err);

      this.stop();
    }
  }

  public async stop(): Promise<void> {
    this.mainCronJob.stop();

    for (const productCronJob of this.productsCronJobs) {
      productCronJob.stop();
    }

    try {
      await this.browser.close();
    } catch (err) {
      logger.error(`${this.loggerHead} something went wrong while closing the browser: `);
      logger.error(err);
    }
  }

  private async refreshScraping(): Promise<void> {
    try {
      await this.page.reload();
      await this.loginIfNotLogged();
      await this.scrapeProductsPage();
    } catch (err) {
      logger.error(`${this.loggerHead} something went wrong while ticking the main job: `);
      logger.error(err);
    }
  }

  private async scrapeProductsPage(): Promise<void> {
    logger.info(`${this.loggerHead} 🕸️ scrapping products page`);

    const productsElements: ElementHandle<HTMLDivElement>[]
      = await this.page.$$('#DadosPaginacaoCalendario .box-resultados .snkr-release');

    for (let i: number = 0; i < productsElements.length; i++) {
      const productElement: ElementHandle<HTMLDivElement> = productsElements[i];
      const product: Product = await this.getProductFromProductElement(productElement);

      if (!this.pool.productUrlExists(product.url)) {
        const productScrapTime: Date = product.releaseDate;

        // start scraping product one minute before its launch
        // productScrapTime.setMinutes(productScrapTime.getMinutes() - 1);

        // const productCronJob: CronJob = new CronJob(
        //   productScrapTime,
        //   (): Promise<void> => this.startProductThread(i, product),
        //   null,
        //   true
        // );

        this.startProductThread(i, product);
        this.pool.addProductUrl(product.url);
        // this.productsCronJobs.push(productCronJob);
        break;
      }
    }

    logger.info(`${this.loggerHead} ✅ products page scrapped successfully`);
  }

  private async startProductThread(i: number, product: Product): Promise<void> {
    try {
      const productPage: Page = await this.browser.newPage();
      const productThread: Thread = new ProductThread(i, this.index, product, productPage);

      productThread.start();
    } catch (err) {
      logger.error(`${this.loggerHead} something went wrong while starting the product job: `);
      logger.error(err);
    }
  }

  private openBrowserInDebugMode(): Promise<void> {
    return new Promise((resolve: Resolve): void => {
      const command: string =
        `${process.env.BROWSER_EXECUTABLE_PATH} ` +
        `--remote-debugging-port=${process.env.BROWSER_PORT}`;

      exec(command, (err: ExecException, stdout: string, stderr: string): void => {
        if (err || stderr) {
          logger.error(err.message || stderr);
          process.exit(1);
        }
      });

      setTimeout(resolve, 2000);
    });
  }

  private async getProductFromProductElement(element: ElementHandle): Promise<Product> {
    const url: string = await element.$eval(
      '.snkr-release__info .snkr-release__bottom .snkr-release__name',
      ({ href }: HTMLLinkElement): string => href
    );

    const name: string = await element.$eval(
      '.snkr-release__info .snkr-release__bottom .snkr-release__name',
      ({ innerText }: HTMLLinkElement): string => innerText
    );

    const releaseDateAsHTML: string = await element.$eval(
      '.snkr-release__info .snkr-release__bottom .snkr-release__countdown',
      ({ innerHTML }: HTMLLinkElement): string => innerHTML
    );

    const releaseDate: Date = this.getReleaseDate(releaseDateAsHTML);

    const product: Product = new Product(url, name, releaseDate);

    return product;
  }

  private getReleaseDate(innerHTML: string): Date {
    const year: number = new Date().getFullYear();

    const [day, month] = innerHTML
      .match(/\d{2}\/\d{2}/g)[0]
      .split('/')
      .map(Number);

    const [hours, minutes] = innerHTML
      .match(/\d{2}:\d{2}/g)[0]
      .split(':')
      .map(Number);

    const date: Date = new Date(year, month - 1, day, hours, minutes);

    return date;
  }

  private async loginIfNotLogged(): Promise<void> {
    const isLogged: boolean = await this.isPageLogged();

    if (!isLogged) {
      await this.login();

      const reCheckIsLogged: boolean = await this.isPageLogged();

      if (!reCheckIsLogged)
        throw new Error('Could not login on page');
    }
  }

  private async isPageLogged(): Promise<boolean> {
    const isLogged: boolean = await this.page.$eval(
      '#header .header-topo-direita .nao_logado a[href="#"]',
      ({ parentElement: { classList } }: HTMLSpanElement): boolean => (
        !classList.contains('active')
      )
    );

    return isLogged;
  }

  private async login(): Promise<void> {
    const emailAddressInput: ElementHandle = await this.page.$(
      'input[type="email"][name="emailAddress"]'
    );

    const passwordInput: ElementHandle = await this.page.$(
      'input[type="password"][name="password"]'
    );

    const emailAddressValue: string = await emailAddressInput
      .evaluate((el: HTMLInputElement): string => el.value);

    const passwordValue: string = await passwordInput
      .evaluate((el: HTMLInputElement): string => el.value);

    await this.page.$eval('#anchor-acessar', (el: HTMLLinkElement): void => el.click());
    await this.page.waitFor(1000);

    if (!emailAddressValue) {
      await insertValueLikeTyping(emailAddressInput, process.env.NIKE_LOGIN_EMAIL);
    }

    if (!passwordValue) {
      await insertValueLikeTyping(passwordInput, process.env.NIKE_LOGIN_PASSWORD);
    }

    await this.page.waitFor(1000);

    await this.page.$eval(
      '.loginSubmit input[type="button"]',
      (el: HTMLInputElement): void => el.click()
    );

    await this.page.waitFor(7500);
  }

}

export default MainThread;
