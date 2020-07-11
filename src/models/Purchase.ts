import { Specification } from './Specification';
import {
  required, Ref, ref, getModel, document, defaultValue, objectId
} from 'typeodm.io';
import { Model, Document, Types } from 'mongoose';

@document()
export class Purchase {

  @required() public price: number;
  @required() @objectId() public productId: Types.ObjectId;
  @required() @ref(Specification) public specification: Ref<Specification>;
  @required() @defaultValue(1) public quantity: number;
  @required() @defaultValue(new Date()) public date: Date;

  constructor(
    price: number, productId: Types.ObjectId,
    specification: Specification, quantity: number = 1,
    date: Date = new Date()
  ) {
    this.date = date;
    this.quantity = quantity;
    this.price = price;
    this.specification = specification;
    this.productId = productId;
  }

}

export type PurchaseDocument = Purchase & Document;
export type PurchaseModel = Model<PurchaseDocument, {}>;

export const PurchaseModel: PurchaseModel = getModel<Purchase>(Purchase);
