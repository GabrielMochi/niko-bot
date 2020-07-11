class CaptchaNotReadyException extends Error {

  constructor() {
    super('Captcha is not ready');
  }

}

export default CaptchaNotReadyException;
