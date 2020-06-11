import Purchase from './Purchase';

class Product {

  public id: string;
  public url: string;
  public name: string;
  public releaseDate: Date;
  public purchases: Purchase[];

  constructor(
    id: string, url: string, name: string,
    releaseDate: Date, purchases: Purchase[] = []
  ) {
    this.id = id;
    this.url = url;
    this.name = name;
    this.releaseDate = releaseDate;
    this.purchases = purchases;
  }

}

export default Product;
