import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductsApiService } from './products-api.service';

describe('ProductsApiService', () => {
  let service: ProductsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ProductsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should query the API with a q parameter for text search', () => {
    const apiProducts = [{ id: 1, title: 'Laptop', price: 1200 }];
    const expectedProducts = [{ id: 1, title: 'Laptop', name: 'Laptop', price: 1200, categoryId: undefined, categoryName: undefined }];

    service.searchProducts('laptop').subscribe((products) => {
      expect(products).toEqual(expectedProducts);
    });

    const req = httpMock.expectOne((request) => request.url.includes('/products') && request.params.get('q') === 'laptop');
    expect(req.request.method).toBe('GET');
    req.flush(apiProducts);
  });
});
