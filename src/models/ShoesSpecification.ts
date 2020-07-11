import { Specification } from './Specification';
import { document, required, getModel } from 'typeodm.io';
import { Model, Document } from 'mongoose';

@document()
export class ShoesSpecification extends Specification {

  public static readonly code: string = '#000000001';

  @required() public color: string;
  @required() public size: number;
  @required() public style: string;

  constructor(color: string, size: number, style: string) {
    super(ShoesSpecification.code);
    this.color = color;
    this.size = size;
    this.style = style;
  }

}

export type ShoesSpecificationDocument = ShoesSpecification & Document;
export type ShoesSpecificationModel = Model<ShoesSpecificationDocument, {}>;

export const ShoesSpecificationModel: ShoesSpecificationModel
  = getModel<ShoesSpecification>(ShoesSpecification);
