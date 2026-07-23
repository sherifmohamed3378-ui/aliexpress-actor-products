/**
 * main.ts
 * Demonstrates the extraction engine flow and provides Apify actor entry point.
 *
 * Flow:
 * HTML → Collectors → Discovery → Indexing → Extractors → Merge → Final Product
 *
 * Can run as standalone example or as Apify Actor with Crawlee PlaywrightCrawler.
 */
import { normalizeAliExpressUrl } from './utils/urlNormalizer.js';
import { ProductExtractionEngine } from './core/ProductExtractionEngine.js';
import { EngineConfigFactory } from './core/config/EngineConfig.js';
import { logger } from './utils/Logger.js';

const log = logger.child('main');

/**
 * Helper: Extract Product ID from URL as a fail-safe fallback
 */
function extractProductIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/item\/(\d+)\.html/) || url.match(/item\/(\d+)/);
  return match?.[1] ?? null;
}

/**
 * Example 1: Simple extraction from HTML string
 */
async function simpleExtractionExample(): Promise<void> {
  log.info('=== Simple Extraction Example ===');

  const sampleHtml = `
    <html>
      <head>
        <title>Test Product - AliExpress</title>
        <meta property="og:title" content="Wireless Bluetooth Earbuds" />
        <meta property="og:image" content="//ae01.alicdn.com/kf/test.jpg" />
        <script>
          window.runParams = {
            data: {
              productId: "1005006000000000",
              subject: "Wireless Bluetooth Earbuds Pro Max",
              salePrice: { value: 29.99, currency: "USD" },
              originalPrice: { value: 59.99 },
              skuProperty: [{ propertyId: "14", propertyName: "Color", values: [{ propertyValueId: "193", propertyValueName: "Black" }] }],
              imageModule: { imagePathList: ["//ae01.alicdn.com/kf/1.jpg", "//ae01.alicdn.com/kf/2.jpg"] },
              tradeModule: { tradeCount: 1500 },
              storeModule: { storeName: "Test Store", storeId: "123456" }
            }
          };
        </script>
      </head>
      <body><h1>Wireless Bluetooth Earbuds Pro Max</h1></body>
    </html>
  `;

  const engine = new ProductExtractionEngine(EngineConfigFactory.debug());

  const result = await engine.extract({
    url: 'https://www.aliexpress.com/item/1005006000000000.html',
    html: sampleHtml,
    windowObjects: {
      runParams: {
        data: {
          productId: '1005006000000000',
          subject: 'Wireless Bluetooth Earbuds Pro Max',
          salePrice: { value: 29.99, currency: 'USD' },
          originalPrice: { value: 59.99 },
          tradeCount: 1500,
        },
      },
    },
  });

  log.info('Extraction completed', {
    title: result.product.title?.value,
    productId: result.product.productId?.value,
    price: result.product.price?.value,
    sources: result.performance.sources,
    fields: result.performance.fields,
    avgConfidence: result.performance.averageConfidence.toFixed(2),
    totalTime: `${result.performance.totalTimeMs}ms`,
  });

  console.log(JSON.stringify(result.product, null, 2));
}

/**
 * Example 2: Advanced extraction with custom config and network responses
 */
async function advancedExtractionExample(): Promise<void> {
  log.info('=== Advanced Extraction Example ===');

  const engine = new ProductExtractionEngine(
    EngineConfigFactory.create({
      confidenceThreshold: 0.3,
      includeRawData: false,
      performanceMode: 'thorough',
      logLevel: 'debug',
    })
  );

  const mockNetworkResponses = [
    {
      url: 'https://www.aliexpress.com/api/product/detail',
      body: {
        productId: '1005006000000001',
        subject: 'Smart Watch Ultra',
        salePrice: '49.99',
        originalPrice: '99.99',
        currency: 'USD',
        skuProperty: [
          {
            propertyId: '14',
            propertyName: 'Color',
            values: [{ propertyValueId: '10', propertyValueName: 'Silver' }],
          },
        ],
        imageModule: {
          imagePathList: ['//ae01.alicdn.com/kf/watch1.jpg'],
        },
      },
    },
  ];

  const html = `<html><head><title>Smart Watch</title></head><body><h1>Smart Watch Ultra</h1></body></html>`;

  const result = await engine.extract({
    url: 'https://www.aliexpress.com/item/1005006000000001.html',
    html,
    networkResponses: mockNetworkResponses,
  });

  log.info('Advanced extraction result', {
    title: result.product.title?.value,
    price: result.product.price,
    warnings: result.warnings.length,
    errors: result.errors.length,
  });
}

/**
 * Example 3: Apify Actor entry point (Enhanced Version with Fail-safes & Deep Extraction)
 */
async function apifyActorEntry(): Promise<void> {
  let Apify: typeof import('apify') | undefined;
  let crawlee: typeof import('crawlee') | undefined;

  try {
    Apify = await import('apify');
    crawlee = await import('crawlee');
  } catch {
    log.info('Apify/Crawlee not available, skipping actor entry');
    return;
  }

  if (!Apify.Actor.isAtHome()) {
    log.info('Not running on Apify platform, actor entry skipped');
    return;
  }

  const input = (await Apify.Actor.getInput()) as {
    startUrls?: { url: string }[];
    maxItems?: number;
    proxyConfiguration?: unknown;
    includeRawData?: boolean;
    confidenceThreshold?: number;
  };

  const rawStartUrls = input?.startUrls ?? [{ url: 'https://www.aliexpress.com/item/1005006000000000.html' }];

// تحويل وتنظيف روابط الأقسام تلقائياً قبل تشغيل الـ Crawler
const startUrls = rawStartUrls.map((item) => {
  if (typeof item === 'string') {
    return normalizeAliExpressUrl(item);
  }
  if (item && typeof item === 'object' && item.url) {
    return { ...item, url: normalizeAliExpressUrl(item.url) };
  }
  return item;
});
  const maxItems = input?.maxItems ?? 10;

  const engine = new ProductExtractionEngine(
    EngineConfigFactory.forApify() as unknown as Partial<import('./core/config/EngineConfig.js').EngineConfig>
  );

  const proxyConfig = await Apify.Actor.createProxyConfiguration(input?.proxyConfiguration as never);

  const crawlerOptions: import('crawlee').PlaywrightCrawlerOptions = {
    ...(proxyConfig ? { proxyConfiguration: proxyConfig as never } : {}),
    maxRequestRetries: 3,
    requestHandler: async ({ request, page }) => {
      const currentUrl: string = request.loadedUrl || request.url || '';
      log.info(`Processing ${currentUrl}`);

      // 1️⃣ الانتظار حتى تحميل الـ DOM الأساسي
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      // 2️⃣ عمل Scroll بسيط لتحفيز الـ Dynamic Rendering والـ Lazy Loading
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1500);

      // 3️⃣ استخراج الـ Window Objects وتفتيش كود الـ Scripts
      const windowObjects = await page.evaluate(() => {
        const result: Record<string, unknown> = {};
        
        const keys = [
          'runParams', 
          '_dida_config_', 
          '__AEP_HEADER_DATA__', 
          '_apolloContext',
          '__INITIAL_STATE__', 
          '__NEXT_DATA__'
        ];

        for (const key of keys) {
          const value = (window as unknown as Record<string, unknown>)[key];
          if (value) result[key] = value;
        }

        // لو runParams مش موجود في window بشكل مباشر، نقرأه من كود الـ Script
        if (!result.runParams) {
          const scripts = Array.from(document.querySelectorAll('script'));
          for (const script of scripts) {
            const content = script.textContent;
            if (content && content.includes('window.runParams')) {
              const match = content.match(/window\.runParams\s*=\s*(\{.*?\});/s);
              if (match && match[1]) {
                try {
                  result.runParams = JSON.parse(match[1]);
                  break;
                } catch {
                  // Ignore JSON parse errors
                }
              }
            }
          }
        }

        return result;
      });

      // 4️⃣ استخراج الـ Product ID المباشر من الـ URL كخط دفاع أخير
      const fallbackProductId = extractProductIdFromUrl(currentUrl);
      if (fallbackProductId) {
        if (!windowObjects.runParams) {
          windowObjects.runParams = { data: { productId: fallbackProductId } };
        } else if (typeof windowObjects.runParams === 'object') {
          const runParamsObj = windowObjects.runParams as Record<string, any>;
          if (!runParamsObj.data) runParamsObj.data = {};
          if (!runParamsObj.data.productId) {
            runParamsObj.data.productId = fallbackProductId;
          }
        }
      }

      const html = await page.content();

      // 5️⃣ تشغيل الـ Extraction Engine
      const extractionResult = await engine.extract({
        url: currentUrl,
        html,
        windowObjects,
      });

      const finalProductId = extractionResult.product.productId?.value || fallbackProductId;

      await Apify.Actor.pushData({
        inputUrl: request.url,
        extractedUrl: currentUrl,
        productId: finalProductId,
        product: {
          ...extractionResult.product,
          productId: finalProductId ? { value: finalProductId, confidence: 1 } : extractionResult.product.productId,
        },
        performance: extractionResult.performance,
      });
    },
  };

  const crawler = new crawlee.PlaywrightCrawler(crawlerOptions);
  await crawler.run(startUrls.slice(0, maxItems));
}

// Main execution switch
async function main(): Promise<void> {
  const mode = process.argv[2] ?? 'simple';

  switch (mode) {
    case 'simple':
      await simpleExtractionExample();
      break;
    case 'advanced':
      await advancedExtractionExample();
      break;
    case 'apify':
      await apifyActorEntry();
      break;
    case 'both':
      await simpleExtractionExample();
      await advancedExtractionExample();
      break;
    default:
      log.info(`Unknown mode ${mode}, running simple example`);
      await simpleExtractionExample();
  }
}

// Run if executed directly (Safely typed string fallback)
const currentScript: string = process.argv[1] || '';
if (currentScript.length > 0 && (currentScript.endsWith('main.ts') || currentScript.endsWith('main.js'))) {
  main().catch((err: unknown) => {
    log.error('Main failed', { error: String(err) });
    process.exit(1);
  });
}

export { simpleExtractionExample, advancedExtractionExample, apifyActorEntry, main };