import { Page, ElementHandle } from 'puppeteer-core';
import { Product } from '../models/Product';
import logger from '../config/logger';
import Thread from './Thread';
import { CronJob } from 'cron';

class ProductThread extends Thread {

  public index: number;
  public mainThreadIndex: number;
  public product: Product;
  public page: Page;
  private job: CronJob;

  private readonly loggerHead: string;

  public constructor(index: number, mainThreadIndex: number, product: Product, page: Page) {
    super();
    this.index = index;
    this.mainThreadIndex = mainThreadIndex;
    this.product = product;
    this.page = page;
    this.loggerHead = `[#${this.mainThreadIndex}][#${this.index} (${this.product.name})]`;
  }

  public async start(): Promise<void> {
    try {
      logger.info(`${this.loggerHead} ⚡ starting the thread`);

      await this.page.goto(this.product.url);

      this.job = new CronJob(
        '*/15 * * * * *', // run ever 15 seconds
        (): Promise<void> => this.refresh(),
        null
      );

      this.refresh(false);
    } catch (err) {
      logger.error(`${this.loggerHead} Something went wrong while executing the thread.`);
      logger.error(err);

      this.stop();
    }
  }

  public async stop(): Promise<void> {
    this.job.stop();
    await this.page.close();
  }

  private async refresh(reload: boolean = true): Promise<void> {
    try {
      if (reload) {
        await this.page.reload();
      }

      await this.page.waitFor(1000);
      const isAvailable: boolean = await this.isProductAvailable();

      logger.info(`${this.loggerHead} ${isAvailable ? 'available' : 'not available'}`);

      if (isAvailable) {
        this.job.stop();
        await this.buyProduct();
      }
    } catch (err) {
      logger.error(`${this.loggerHead} something went wrong while ticking the main job: `);
      logger.error(err);
      this.stop();
    }
  }

  private async isProductAvailable(): Promise<boolean> {
    const isAvailable: boolean = await this.page.$eval(
      '#btn-comprar',
      (el: HTMLButtonElement): boolean => el !== null
    );

    return isAvailable;
  }

  private async buyProduct(): Promise<void> {
    await this.selectSize();
    await this.page.waitFor(500);
    await this.clickOnBuyButton();
    await this.page.waitFor(2000);
    await this.goToCheckoutPage();
    await this.page.waitFor(500);
    await this.clickOnGoToPaymentButton();
    await this.page.waitFor(500);
    await this.clickOnConfirmAddressButton();
    await this.page.waitFor(500);
    await this.selectCreditCard();
    await this.page.waitFor(500);
    await this.acceptExchangeAndCancellationPolicy();
    await this.page.waitFor(500);
    await this.clickOnConfirmPaymentButton();
  }

  private async selectSize(): Promise<number> {
    const sizesElements: ElementHandle[] = await this.page.$$(
      '#variacoes li:not(.tamanho-desabilitado) input'
    );

    if (sizesElements.length === 0) {
      throw new Error('No sizes available');
    }

    const averageIndex: number = Math.ceil(sizesElements.length / 2);
    const selectedSizeElement: ElementHandle = sizesElements[averageIndex];

    const selectedSizeValue: number = await selectedSizeElement
      .evaluate((el: HTMLInputElement): number => Number(el.getAttribute('data-tamanho')));

    await selectedSizeElement.evaluate((el: HTMLInputElement): void => el.click());

    return selectedSizeValue;
  }

  private async clickOnBuyButton(): Promise<void> {
    await this.page.$eval(
      '#btn-comprar',
      (el: HTMLButtonElement): void => el.click()
    );
  }

  private async goToCheckoutPage(): Promise<void> {
    await this.page.goto('https://www.nike.com.br/Checkout');
  }

  private async clickOnGoToPaymentButton(): Promise<void> {
    await this.page.$eval(
      '#seguir-pagamento',
      (el: HTMLButtonElement): void => el.click()
    );
  }

  private async clickOnConfirmAddressButton(): Promise<void> {
    await this.page.$eval(
      '[id^="modalNotice"] div.modal-footer button:not([data-dismiss])',
      (el: HTMLButtonElement): void => el.click()
    );
  }

  private async selectCreditCard(): Promise<void> {
    await this.page.$eval(
      '#cartoes-salvos .select-cta-options .select-cta-option input',
      (el: HTMLInputElement): void => el.click()
    );
  }

  private async acceptExchangeAndCancellationPolicy(): Promise<void> {
    await this.page.$eval(
      '#politica-trocas',
      (el: HTMLInputElement): void => el.click()
    );
  }

  private async clickOnConfirmPaymentButton(): Promise<void> {
    await this.page.$eval(
      '#confirmar-pagamento',
      (el: HTMLButtonElement): void => el.click()
    );
  }

}

export default ProductThread;
