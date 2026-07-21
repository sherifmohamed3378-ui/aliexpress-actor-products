/**
 * Custom extractor example - extend engine with new field
 */
import { ProductExtractionEngine, BaseExtractor, type FoundEntry, TextNormalizer } from '../src/index.js';

class WarrantyExtractor extends BaseExtractor<string> {
  override readonly id: string = 'warranty';
  override readonly signals = ['warranty', 'warrantyInfo', 'guarantee'] as const;

  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}

async function main(): Promise<void> {
  const engine = new ProductExtractionEngine();
  engine.getRegistry().register(new WarrantyExtractor());

  const result = await engine.extract({
    url: 'https://www.aliexpress.com/item/123.html',
    html: '<html></html>',
    windowObjects: {
      extra: { warranty: '2 years manufacturer warranty', productId: '123', subject: 'Test Product' },
    },
  });

  console.log('Custom field extraction - registry size:', engine.getRegistry().size());
  console.log('Product title:', result.product.title?.value);
  // Warranty field would be in merged product if we extended AliExpressProduct type,
  // but shows how to add extractor
}

main().catch(console.error);
