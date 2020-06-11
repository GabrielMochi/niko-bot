class Pool {

  public static readonly productsUrl: string[] = [];

  public static addProductUrl(productUrl: string): void {
    const productUrlExists: boolean = this.productUrlExists(productUrl);

    if (!productUrlExists) {
      this.productsUrl.push(productUrl);
    }
  }

  public static removeProductUrl(productUrl: string): void {
    const productUrlExists: boolean = this.productUrlExists(productUrl);

    if (productUrlExists) {
      const productUrlIndex: number = this.findProductUrlIndex(productUrl);
      this.productsUrl.splice(productUrlIndex, 1);
    }
  }

  private static productUrlExists(productUrl: string): boolean {
    const urlExists: boolean = this.productsUrl.some(
      (_productUrl: string): boolean => _productUrl === productUrl
    );

    return urlExists;
  }

  private static findProductUrlIndex(productUrl: string): number {
    const productUrlIndex: number = this.productsUrl.findIndex(
      (_productUrl: string): boolean => _productUrl === productUrl
    );

    return productUrlIndex;
  }

}

export default Pool;
