import Specification from './Specification';

class Purchase {

  public id: string;
  public productId: string;
  public date: Date;
  public specification: Specification;
  public quantity: number;
  public price: number;

  constructor(
    id: string, productId: string, date: Date,
    specification: Specification, quantity: number,
    price: number
  ) {
    this.id = id;
    this.productId = productId;
    this.date = date;
    this.specification = specification;
    this.quantity = quantity;
    this.price = price;
  }

}

export default Purchase;
