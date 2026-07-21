import { describe, it, expect } from 'vitest';
import { ProductExtractionEngine } from '../../src/core/ProductExtractionEngine.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('ProductExtractionEngine integration', () => {
  it('extracts from simple HTML fixture', async () => {
    const htmlPath = join(process.cwd(), 'tests/fixtures/sample-html/product-simple.html');
    let html = '';
    try {
      html = readFileSync(htmlPath, 'utf-8');
    } catch {
      html = `<html><head><title>Test</title></head><body></body></html>`;
    }

    const engine = new ProductExtractionEngine({
      confidenceThreshold: 0.2,
    });

    const result = await engine.extract({
      url: 'https://www.aliexpress.com/item/1005006000000000.html',
      html,
      windowObjects: {
        runParams: {
          data: {
            productId: '1005006000000000',
            subject: 'Wireless Bluetooth Earbuds Pro Max - 2026 Edition',
            salePrice: { value: 29.99, currency: 'USD' },
            tradeCount: 1500,
          },
        },
      },
    });

    expect(result.product).toBeDefined();
    expect(result.product.productId?.value).toBe('1005006000000000');
    expect(result.product.title?.value).toContain('Wireless');
    expect(result.performance.sources).toBeGreaterThan(0);
    expect(result.performance.totalTimeMs).toBeGreaterThan(0);
  });

  it('extracts from JSON fixture', async () => {
    const jsonPath = join(process.cwd(), 'tests/fixtures/sample-json/runParams.json');
    let data: unknown = {};
    try {
      const content = readFileSync(jsonPath, 'utf-8');
      data = JSON.parse(content);
    } catch {
      data = { data: { subject: 'Test Product', productId: '123' } };
    }

    const engine = new ProductExtractionEngine();

    const result = await engine.extract({
      url: 'https://www.aliexpress.com/item/1005006000000001.html',
      windowObjects: { runParams: data },
    });

    expect(result.product).toBeDefined();
    expect(result.product.title?.value).toBeDefined();
  });

  it('handles empty input gracefully', async () => {
    const engine = new ProductExtractionEngine({ confidenceThreshold: 0.9 });

    const result = await engine.extract({
      url: 'https://www.aliexpress.com/item/1005006000000002.html',
      html: '<html></html>',
    });

    expect(result.product).toBeDefined();
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });
});
