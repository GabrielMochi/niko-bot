import { Page } from 'puppeteer';
import axios from 'axios';
import qs from 'qs';
import { wait } from '../utils/generalUtils';
import logger from '../config/logger';
import { EventEmitter } from 'events';
import CaptchaNotReadyException from '../exceptions/CaptchaNotReadyException';
import CaptchaUnsolvableException from '../exceptions/CaptchaUnsolvableException';
import CaptchaNoSlotAvailableException from '../exceptions/CaptchaNoSlotAvailableException';
import Resolve from '../interfaces/Resolve';
import Reject from '../interfaces/Reject';

export type SubmitCaptchaResponse = {
  status: number,
  request: string
};

export type GetCaptchaTokenResponse = {
  status: number,
  request: string,
  user_check: string,
  user_score: string
};

export type ValidateCaptchaRequest = {
  token: string,
  action: string,
  v: string
};

export type ValidateCaptchaResponse = {
  success: boolean,
  message: string
};

export type LoopUntilGetCaptchaTokenFun = () => Promise<string>;

export enum CaptchaActions {
  LOGIN = 'login',
  SNEAKERS = 'pdp_snkrs',
  ADD_TO_CART = 'add_to_cart'
}

class CaptchaSolver extends EventEmitter {

  private static readonly instancesNumber: number = Number(
    process.env.CAPTCHA_INSTANCES_NUMBER
  );

  private static readonly maximumRetries: number = Number(
    process.env.MAXIMUM_CAPTCHA_RETRIES
  );

  private isCaptchaReady: boolean = false;

  public async byPassLoginCaptcha(page: Page): Promise<void> {
    await this.fireSolvers(page, CaptchaActions.LOGIN);
  }

  public async byPassSneakersCaptcha(page: Page): Promise<void> {
    await this.fireSolvers(page, CaptchaActions.SNEAKERS);
  }

  public async byPassAddToCartCaptcha(page: Page): Promise<void> {
    await this.fireSolvers(page, CaptchaActions.ADD_TO_CART);
  }

  private fireSolvers(page: Page, action: CaptchaActions): Promise<void> {
    return new Promise<void>((resolve: Resolve, reject: Reject): void => {
      this.on('success', resolve);
      this.on('error', reject);

      [...Array(CaptchaSolver.instancesNumber).keys()].forEach((i: number): void => {
        this.solveCaptcha(i, page, action);
      });
    });
  }

  async solveCaptcha(id: number, page: Page, action: CaptchaActions, i: number = 0): Promise<void> {
    try {
      logger.info(`[CAPTCHA SOLVER (${action}) #${id}] start solving the captcha`);

      const captchaSiteKey: string = await this.getCaptchaSiteKey(page);
      const pageUrl: string = page.url();

      const captchaSubmissionId: string = await this.submitCaptcha(
        captchaSiteKey, pageUrl, action
      );

      const loopUntilGetCaptchaToken: LoopUntilGetCaptchaTokenFun = async (): Promise<string> => {
        try {
          const token: string = await this.getCaptchaToken(captchaSubmissionId);
          return token;
        } catch (err) {
          if (
            err instanceof CaptchaNotReadyException ||
            err instanceof CaptchaNoSlotAvailableException
          ) {
            const token: string = await loopUntilGetCaptchaToken();
            return token;
          }

          throw err;
        }
      };

      try {
        const captchaToken: string = await loopUntilGetCaptchaToken();
        await this.validateCaptcha(captchaToken, action);

        this.isCaptchaReady = true;
        this.emit('success');

        logger.info(`[CAPTCHA SOLVER (${action}) #${id}] solved the captcha`);
        this.reportGoodCaptchaId(id, captchaSubmissionId, action);
      } catch (err) {
        this.reportBadCaptchaId(id, captchaSubmissionId, action);

        if (i >= CaptchaSolver.maximumRetries) {
          logger.info(`[CAPTCHA SOLVER (${action}) #${id}] captcha unsolvable`);
        }

        if (!this.isCaptchaReady) {
          logger.info(`[CAPTCHA SOLVER (${action}) #${id}] retrying to solve the captcha`);
          await this.solveCaptcha(id, page, action, ++i);
          return;
        }
      }
    } catch (err) {
      if (err instanceof CaptchaNoSlotAvailableException) {
        logger.info(`[CAPTCHA SOLVER (${action}) #${id}] retrying to solve the captcha`);
        await this.solveCaptcha(id, page, action, i);
        return;
      }

      logger.info(`[CAPTCHA SOLVER (${action}) #${id}] error while solving the captcha`);
      this.emit('error', err);
    }
  }

  async getCaptchaSiteKey(page: Page): Promise<string> {
    const siteKey: string = await page.evaluate((): string => {
      const clients: any = (window as any).___grecaptcha_cfg.clients;
      const [key] = Object.keys(clients);
      const client: any = clients[key];

      return client.$.$.sitekey;
    });

    return siteKey;
  }

  async submitCaptcha(
    captchaSiteKey: string,
    pageUrl: string,
    action: CaptchaActions
  ): Promise<string> {
    const { data: { status, request } } = await axios.get<SubmitCaptchaResponse>(
      'https://2captcha.com/in.php',
      {
        params: {
          key: process.env._2CAPTCHA_KEY,
          method: 'userrecaptcha',
          version: 'v3',
          action,
          min_score: process.env._2CAPTCHA_MIN_SCORE,
          googlekey: captchaSiteKey,
          json: '1',
          pageurl: pageUrl
        }
      }
    );

    if (status === 0) {
      if (request === 'ERROR_NO_SLOT_AVAILABLE') {
        throw new CaptchaNoSlotAvailableException();
      }

      throw new Error(request);
    }

    return request;
  }

  async getCaptchaToken(captchaSubmissionId: string): Promise<string> {
    const { data: { status, request } } = await axios.get<GetCaptchaTokenResponse>(
      'https://2captcha.com/res.php',
      {
        params: {
          key: process.env._2CAPTCHA_KEY,
          action: 'get',
          taskinfo: '1',
          json: '1',
          id: captchaSubmissionId
        }
      }
    );

    if (status === 0) {
      if (request === 'ERROR_NO_SLOT_AVAILABLE') {
        throw new CaptchaNoSlotAvailableException();
      }

      if (request === 'CAPCHA_NOT_READY') {
        throw new CaptchaNotReadyException();
      }

      if (request === 'CAPTCHA_UNSOLVABLE') {
        throw new CaptchaUnsolvableException();
      }

      throw new Error(request);
    }

    return request;
  }

  async validateCaptcha(token: string, action: CaptchaActions): Promise<void> {
    const bodyRequest: ValidateCaptchaRequest = {
      token,
      action,
      v: process.env.NIKE_CAPTCHA_VERSION
    };

    const data: string = qs.stringify(bodyRequest);

    const { data: { success, message } } = await axios.post<ValidateCaptchaResponse>(
      process.env.NIKE_VALIDATE_CAPTCHA_API_ENDPOINT,
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'PostmanRuntime/7.25.0',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      }
    );

    if (!success) throw new Error(message);
  }

  async reportGoodCaptchaId(
    solverId: number,
    captchaSubmissionId: string,
    action: CaptchaActions
  ): Promise<void> {
    try {
      await axios.get('https://2captcha.com/res.php', {
        params: {
          key: process.env._2CAPTCHA_KEY,
          action: 'reportgood',
          id: captchaSubmissionId
        }
      });

      logger.info(`[CAPTCHA SOLVER (${action}) #${solverId}] good captcha ` +
        'id reported successfully');
    } catch (err) {
      logger.error(err);
    }
  }

  async reportBadCaptchaId(
    solverId: number,
    captchaSubmissionId: string,
    action: CaptchaActions
  ): Promise<void> {
    try {
      await axios.get('https://2captcha.com/res.php', {
        params: {
          key: process.env._2CAPTCHA_KEY,
          action: 'reportbad',
          id: captchaSubmissionId
        }
      });

      logger.info(`[CAPTCHA SOLVER (${action}) #${solverId}] bad captcha ` +
        'id reported successfully');
    } catch (err) {
      logger.error(err);
    }
  }

}

export default CaptchaSolver;
