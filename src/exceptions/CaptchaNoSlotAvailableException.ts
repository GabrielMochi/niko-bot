class CaptchaNoSlotAvailableException extends Error {

  constructor() {
    super('Captcha no slot available');
  }

}

export default CaptchaNoSlotAvailableException;
