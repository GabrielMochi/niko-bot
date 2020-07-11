export default class CreditCard {

  public lastDigits: string;
  public holder: string;
  public billingAddress: string;
  public expiration: Date;

  constructor(lastDigits: string, holder: string, billingAddress: string, expiration: Date) {
    this.lastDigits = lastDigits;
    this.holder = holder;
    this.billingAddress = billingAddress;
    this.expiration = expiration;
  }

}
