import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<ProductCardComponent>;
  let component: ProductCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', {
      id: 1,
      title: 'Test Product',
      price: 25,
      images: ['https://example.com/image.jpg']
    });
    fixture.detectChanges();
  });

  it('renders the product title and first image from the backend schema', () => {
    const title = fixture.nativeElement.querySelector('h3')?.textContent;
    const image = fixture.nativeElement.querySelector('.product-image') as HTMLImageElement | null;

    expect(title).toContain('Test Product');
    expect(image?.getAttribute('src')).toBe('https://example.com/image.jpg');
  });
});
