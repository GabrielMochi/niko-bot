import { Purchase, PurchaseDocument } from './Purchase';
import {
  document, required, unique, arrayOf, ref,
  Ref, defaultValue, getModel, index, method
} from 'typeodm.io';
import { Model, Document } from 'mongoose';

@document()
export class Product {

  @required() @unique() @index() public url: string;
  @required() public name: string;
  @required() public releaseDate: Date;

  @required()
  @arrayOf(Purchase)
  @ref(Purchase)
  @defaultValue([])
  private purchases: Ref<Purchase>[];

  constructor(
    url: string, name: string, releaseDate: Date,
    purchases: Purchase[] = []
  ) {
    this.url = url;
    this.name = name;
    this.releaseDate = releaseDate;
    this.purchases = purchases;
  }

  @method
  public async setPurchase(
    this: ProductDocument,
    purchase: PurchaseDocument
  ): Promise<void> {
    purchase.productId = this._id;
    await purchase.save();

    this.purchases.push(purchase);
  }

  @method
  public async setAllPurchases(
    this: ProductDocument,
    purchases: PurchaseDocument[]
  ): Promise<void> {
    for (const purchase of purchases) {
      await this.setPurchase(purchase);
    }
  }

}

export type ProductDocument = Product & Document;
export type ProductModel = Model<ProductDocument, {}>;

export const ProductModel: ProductModel = getModel<Product>(Product);
