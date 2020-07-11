class CaptchaUnsolvableException extends Error {

  constructor() {
    super('Captcha is unsolvable');
  }

}

export default CaptchaUnsolvableException;
