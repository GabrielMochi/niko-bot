import { Page, ElementHandle } from 'puppeteer';
import { Product } from '../models/Product';
import logger from '../config/logger';
import Thread from './Thread';
import PredefinedSizeNotFoundException from '../exceptions/PredefinedSizeNotFoundException';

class ProductThread extends Thread {

  public index: number;
  public mainThreadIndex: number;
  public product: Product;
  public page: Page;

  private readonly loggerHead: string;

  public constructor(index: number, mainThreadIndex: number, product: Product, page: Page) {
    super();
    this.index = index;
    this.mainThreadIndex = mainThreadIndex;
    this.product = product;
    this.page = page;
    this.loggerHead = `[#${this.mainThreadIndex}][#${this.index}](${this.product.name})`;
  }

  public async start(): Promise<void> {
    logger.info(`${this.loggerHead} ⚡ starting the thread`);

    try {
      await this.page.goto(this.product.url);
      await this.loopUntilProductIsAvailable();
    } catch (err) {
      logger.error(`${this.loggerHead} error while starting the thread.`);
      logger.error(err.message);
    } finally {
      this.stop();
    }
  }

  public async stop(): Promise<void> {
    logger.info(`${this.loggerHead} stopping the thread`);

    try {
      await this.page.close();
    } catch (err) {
      logger.error(`${this.loggerHead} error while stopping the thread`);
      logger.error(err.message);
    }
  }

  private async loopUntilProductIsAvailable(counter: number = 0): Promise<void> {
    logger.info(`${this.loggerHead} looping until product is available at ${counter} time`);

    try {
      if (counter >= 200) throw new Error('Maximum attempts exceeds');

      await this.page.waitFor(5000);
      const isAvailable: boolean = await this.isProductAvailable();

      if (!isAvailable) {
        logger.info(`${this.loggerHead} product not available =(`);
        await this.page.reload();
        await this.loopUntilProductIsAvailable(++counter);
        return;
      }

      logger.info(`${this.loggerHead} product available =)`);
      await this.buyProduct();
    } catch (err) {
      logger.error(`${this.loggerHead} error while looping until product is available: `);
      throw err;
    }
  }

  private async isProductAvailable(): Promise<boolean> {
    logger.info(`${this.loggerHead} checking if product is available`);

    try {
      const isAvailable: boolean = await this.page.$eval(
        '#btn-comprar',
        (el: HTMLButtonElement): boolean => el !== null
      );

      return isAvailable;
    } catch (err) {
      return false;
    }
  }

  private async buyProduct(): Promise<void> {
    logger.info(`${this.loggerHead} buying product`);

    try {
      const lastCreditCardDigits: number = process.env.DEFAULT_LAST_CREDIT_CARD_DIGITS
        ? Number(process.env.DEFAULT_LAST_CREDIT_CARD_DIGITS)
        : undefined;

      await this.selectSize();
      await this.page.waitFor(500);
      await this.clickOnBuyButton();
      await this.page.waitFor(4000);
      await this.goToCheckoutPage();
      await this.page.waitFor(2000);
      await this.clickOnGoToPaymentButton();
      await this.page.waitFor(500);
      await this.clickOnConfirmAddressButton();
      await this.page.waitFor(500);
      await this.selectCreditCard(lastCreditCardDigits);
      await this.page.waitFor(500);
      await this.acceptExchangeAndCancellationPolicy();
      await this.page.waitFor(500);
      await this.clickOnConfirmPaymentButton();
    } catch (err) {
      logger.error(`${this.loggerHead} error while buying size`);
      throw err;
    }
  }

  // TODO: reduce this function into small ones
  private async selectSize(predefinedSize?: number): Promise<void> {
    logger.info(`${this.loggerHead} selecting size`);

    try {
      const sizesElements: ElementHandle[] = await this.page.$$(
        '#variacoes li:not(.tamanho-desabilitado) input'
      );

      if (sizesElements.length === 0) {
        throw new Error('No sizes available');
      }

      const selectSizeByPredefinedSize: () => Promise<void> = async (): Promise<void> => {
        for (const sizeElement of sizesElements) {
          const sizeValue: number = await sizeElement
            .evaluate((el: HTMLInputElement): number => (
              Number(el.getAttribute('data-tamanho'))
            ));

          if (sizeValue === predefinedSize) {
            await sizeElement.evaluate((el: HTMLInputElement): void => el.click());
            return;
          }
        }

        throw new PredefinedSizeNotFoundException();
      };

      if (predefinedSize) {
        try {
          await selectSizeByPredefinedSize();
          return;
        } catch (err) {
          if (!(err instanceof PredefinedSizeNotFoundException)) {
            throw err;
          }

          logger.info(`${this.loggerHead} predefined size not found. Selecting another one...`);
        }
      }

      const averageIndex: number = Math.ceil(sizesElements.length / 2);
      const selectedSizeElement: ElementHandle = sizesElements[averageIndex];

      await selectedSizeElement.evaluate((el: HTMLInputElement): void => el.click());
    } catch (err) {
      logger.error(`${this.loggerHead} error while selecting size`);
      throw err;
    }
  }

  private async clickOnBuyButton(): Promise<void> {
    logger.info(`${this.loggerHead} clicking on buy button`);

    try {
      await this.page.$eval(
        '#btn-comprar',
        (el: HTMLButtonElement): void => el.click()
      );
    } catch (err) {
      logger.error(`${this.loggerHead} error while clicking on buy button`);
      throw err;
    }
  }

  private async goToCheckoutPage(): Promise<void> {
    logger.info(`${this.loggerHead} going to checkout page`);

    try {
      await this.page.goto('https://www.nike.com.br/Checkout');
    } catch (err) {
      logger.error(`${this.loggerHead} error while going to checkout page (carrinho)`);
      throw err;
    }
  }

  private async clickOnGoToPaymentButton(): Promise<void> {
    logger.info(`${this.loggerHead} clicking on go to payment button`);

    try {
      await this.page.$eval(
        '#seguir-pagamento',
        (el: HTMLButtonElement): void => el.click()
      );
    } catch (err) {
      logger.error(`${this.loggerHead} error while clicking on go to payment button`);
      throw err;
    }
  }

  private async clickOnConfirmAddressButton(): Promise<void> {
    logger.info(`${this.loggerHead} clicking on confirming address button`);

    try {
      await this.page.$eval(
        '[id^="modalNotice"] div.modal-footer button:not([data-dismiss])',
        (el: HTMLButtonElement): void => el.click()
      );
    } catch (err) {
      logger.error(`${this.loggerHead} error while clicking on confirming address button`);
      throw err;
    }
  }

  private async selectCreditCard(lastCreditCardDigits?: number): Promise<void> {
    logger.info(`${this.loggerHead} selecting credit card`);

    const creditCardQuery: string =
      '#cartoes-salvos .select-cta-options .select-cta-option input'
      + (lastCreditCardDigits
        ? `[data-lastdigits='${lastCreditCardDigits}']`
        : '');

    try {
      await this.page.$eval(
        creditCardQuery,
        (el: HTMLInputElement): void => el.click()
      );
    } catch (err) {
      logger.error(`${this.loggerHead} error while selecting credit card`);
      throw err;
    }
  }

  private async acceptExchangeAndCancellationPolicy(): Promise<void> {
    logger.info(`${this.loggerHead} accepting policy`);

    try {
      await this.page.$eval(
        '#politica-trocas',
        (el: HTMLInputElement): void => el.click()
      );
    } catch (err) {
      logger.error(`${this.loggerHead} error while accepting policy`);
      throw err;
    }
  }

  private async clickOnConfirmPaymentButton(): Promise<void> {
    logger.info(`${this.loggerHead} clicking on confirm payment button`);

    try {
      await this.page.$eval(
        '#confirmar-pagamento',
        (el: HTMLButtonElement): void => el.click()
      );
    } catch (err) {
      logger.error(`${this.loggerHead} error while clicking on confirm payment button`);
      throw err;
    }
  }

}

export default ProductThread;
