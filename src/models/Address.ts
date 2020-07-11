export enum AddressType {
  COMERCIAL = 'Comercial',
  RESIDENCIAL = 'Residencial'
}

export default class Address {

  public location: string;
  public type: AddressType;

  constructor(location: string, type: AddressType) {
    this.location = location;
    this.type = type;
  }

}
