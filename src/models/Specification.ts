import { required, document } from 'typeodm.io';
import { Document } from 'mongoose';

@document()
export abstract class Specification {

  @required() public code: string;

  constructor(code: string) {
    this.code = code;
  }

}

export type SpecificationDocument = Specification & Document;
