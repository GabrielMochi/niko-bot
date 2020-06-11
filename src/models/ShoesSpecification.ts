import Specification from './Specification';

class ShoesSpecification extends Specification {

  public static readonly code: string = '#000000001';

  public color: string;
  public size: number;
  public style: string;

  constructor(color: string, size: number, style: string) {
    super(ShoesSpecification.code);

    this.color = color;
    this.size = size;
    this.style = style;
  }

}

export default ShoesSpecification;
