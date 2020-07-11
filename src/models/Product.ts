export default class Product {

  public id: string;
  public name: string;
  public url: string;
  public releaseDate: Date;
  public price: number;
  public size: number;

  constructor(
    id: string, name: string, url: string,
    releaseDate: Date, price: number, size: number
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.releaseDate = releaseDate;
    this.price = price;
    this.size = size;
  }

}
