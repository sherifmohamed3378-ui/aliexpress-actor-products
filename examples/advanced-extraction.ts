/**
 * Advanced extraction with network responses and custom config
 */
import { ProductExtractionEngine, EngineConfigFactory } from '../src/index.js';

async function main(): Promise<void> {
  const engine = new ProductExtractionEngine(EngineConfigFactory.thorough());

  const networkResponses = [
    {
      url: 'https://www.aliexpress.com/api/product/detail',
      body: {
        productId: '1005006000000001',
        subject: 'Smart Watch Ultra 2',
        salePrice: '49.99',
        originalPrice: '99.99',
        currency: 'USD',
        imageModule: { imagePathList: ['//ae01.alicdn.com/kf/watch1.jpg'] },
        skuProperty: [{ propertyId: '14', propertyName: 'Color', values: [{ propertyValueId: '10', propertyValueName: 'Silver' }] }],
      },
    },
  ];

  const result = await engine.extract({
    url: 'https://www.aliexpress.com/item/1005006000000001.html',
    html: '<html><head><title>Smart Watch</title></head><body></body></html>',
    networkResponses,
  });

  console.log('Product:', result.product.title?.value);
  console.log('SKU Properties:', result.product.skuProperties?.value);
  console.log('Warnings:', result.warnings);
  console.log('Performance:', result.performance);
}

main().catch(console.error);
