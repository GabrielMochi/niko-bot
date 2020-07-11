class Pool {

  private readonly productsUrl: string[];

  public constructor(productsUrl: string[] = []) {
    this.productsUrl = productsUrl;
  }

  public addProductUrl(productUrl: string): void {
    const productUrlExists: boolean = this.productUrlExists(productUrl);

    if (!productUrlExists) {
      this.productsUrl.push(productUrl);
    }
  }

  public productUrlExists(productUrl: string): boolean {
    const urlExists: boolean = this.productsUrl.some(
      (_productUrl: string): boolean => _productUrl === productUrl
    );

    return urlExists;
  }

}

export default Pool;
