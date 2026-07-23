/**
 * PlaywrightCrawler setup for AliExpress product pages with selector-wait & inline script extraction.
 */
import { normalizeAliExpressUrl } from '../utils/urlNormalizer.js';
import { PlaywrightCrawler } from 'crawlee';
import type { ProxyConfiguration } from 'crawlee';

import type { ProductExtractionEngine } from '../core/ProductExtractionEngine.js';
import { logger } from '../utils/Logger.js';

import type { ActorInput } from './input.js';
import { formatActorErrorOutput, formatActorOutput } from './output.js';

const log = logger.child('actor.crawler');

export interface ProductCrawlerOptions {
  readonly engine: ProductExtractionEngine;
  readonly input: ActorInput;
  readonly proxyConfiguration?: ProxyConfiguration;
  readonly pushData: (record: Record<string, unknown>) => Promise<void>;
}

function extractProductIdFromUrl(url: string): string | null {
  const match = url.match(/\/item\/(\d+)\.html/);
  return match && match[1] ? match[1] : null;
}

export async function runProductCrawler(options: ProductCrawlerOptions): Promise<void> {
  const { engine, input, proxyConfiguration, pushData } = options;
  const startUrls = input.startUrls.map((s) => normalizeAliExpressUrl(s.url)).slice(0, input.maxItems);

  // القيم القادمة من الـ Input (مع قيود أمان إضافية للقيم الافتراضية)
  const targetCountry = (input.country || 'US').toUpperCase();
  const targetCurrency = (input.currency || 'USD').toUpperCase();
  const targetLocale = input.locale || 'en_US';

  log.info('Starting product crawler with dynamic region settings', {
    urlCount: startUrls.length,
    maxItems: input.maxItems,
    country: targetCountry,
    currency: targetCurrency,
    locale: targetLocale,
  });

  const crawler = new PlaywrightCrawler({
    ...(proxyConfiguration ? { proxyConfiguration } : {}),

    // 1) تقليل التوازي لـ 1 لتجنب منع علي إكسبريس للطلبات المتزامنة
    maxConcurrency: 1,
    maxRequestsPerCrawl: (input.maxItems ?? 10) * 2,
    maxRequestRetries: 3,
    navigationTimeoutSecs: 90,
    requestHandlerTimeoutSecs: 180,

    launchContext: {
      launchOptions: {
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=1920,1080',
        ],
      },
    },

    preNavigationHooks: [
      async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        // 2) بناء الكوكي ديناميكياً حسب اختيار المستخدم في Apify
        const cookieValue = `site=glo&region=${targetCountry}&b_locale=${targetLocale}&currency=${targetCurrency}`;

        await page.context().addCookies([
          {
            name: 'aep_usuc_f',
            value: cookieValue,
            domain: '.aliexpress.com',
            path: '/',
          },
          {
            name: 'aep_usuc_f',
            value: cookieValue,
            domain: '.aliexpress.us',
            path: '/',
          },
          {
            name: 'intl_locale',
            value: targetLocale,
            domain: '.aliexpress.com',
            path: '/',
          },
        ]);
      },
    ],

    requestHandler: async ({ request, page, log: requestLog }) => {
      const inputUrl = request.url;
      const extractedUrl = request.loadedUrl ?? request.url;

      // 1) معالجة صفحات الأقسام والبحث
      const isCategoryOrSearch =
        extractedUrl.includes('/category/') ||
        extractedUrl.includes('/wholesale') ||
        extractedUrl.includes('search') ||
        extractedUrl.includes('/g/');

      if (isCategoryOrSearch && request.label !== 'PRODUCT') {
        requestLog.info(`[Category Page] Processing: ${extractedUrl}`);

        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        for (let i = 0; i < 4; i++) {
          await page.evaluate(() => window.scrollBy(0, 800));
          await page.waitForTimeout(500);
        }

        // استخراج روابط المنتجات: (1) من الـ Inline JSON المباشر أولاً، (2) كـ Fallback من الـ DOM
        const productUrls = await page.evaluate(() => {
          const urls = new Set<string>();
          let items: any[] = [];
          const w = window as any;

          // 1️⃣ البحث في كائنات window المدمجة
          const runParams = w.runParams || w._additionalData_ || w.__AEP_DATA__;

          if (runParams?.mods?.itemList?.content) {
            items = runParams.mods.itemList.content;
          } else if (runParams?.body?.itemList?.content) {
            items = runParams.body.itemList.content;
          } else {
            // التفتيش داخل الـ script tags لو مش متوافرة في window مباشراً
            const scripts = Array.from(document.querySelectorAll('script'));
            for (const script of scripts) {
              const text = script.textContent || '';
              if (text.includes('runParams') || text.includes('itemList')) {
                try {
                  const match = text.match(/runParams\s*=\s*(\{.*?\});/s) || text.match(/_additionalData_\s*=\s*(\{.*?\});/s);
                  if (match && match[1]) {
                    const parsed = JSON.parse(match[1]);
                    items = parsed?.mods?.itemList?.content || parsed?.body?.itemList?.content || [];
                    if (items.length > 0) break;
                  }
                } catch (e) {
                  // Ignore JSON parse errors
                }
              }
            }
          }

          // تحويل الـ IDs لروابط مباشرة
          for (const item of items) {
            const id = item.productId || item.itemId || item.id;
            if (id) {
              urls.add(`https://www.aliexpress.com/item/${id}.html`);
            }
          }

          // 2️⃣ Fallback: لو الـ JSON مطلعش منتجات، ندور في الـ DOM عن عناصر <a>
          if (urls.size === 0) {
            const anchors = Array.from(document.querySelectorAll('a[href*="/item/"]')) as HTMLAnchorElement[];
            for (const a of anchors) {
              let href = a.getAttribute('href');
              if (!href) continue;

              if (href.startsWith('//')) href = `https:${href}`;
              else if (href.startsWith('/')) href = `https://www.aliexpress.com${href}`;

              const match = href.match(/\/item\/(\d+)\.html/);
              if (match) {
                urls.add(`https://www.aliexpress.com/item/${match[1]}.html`);
              }
            }
          }

          return Array.from(urls);
        });

        requestLog.info(`Found ${productUrls.length} valid product links`);

        if (productUrls.length > 0) {
          const maxItems = input.maxItems ?? 10;
          const targetUrls = productUrls.slice(0, maxItems);
          const requestsToAdd = targetUrls.map((url) => ({
            url,
            label: 'PRODUCT',
          }));
          await crawler.addRequests(requestsToAdd);
        }
        return;
      }

      // 2) معالجة صفحة المنتج
      requestLog.info(`[Product Page] Extracting: ${extractedUrl}`);

      try {
        await page.waitForLoadState('domcontentloaded');

        // انتظار استقرار طلبات الشبكة للتحقق من اكتمال تحميل عناصر الصفحة
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
          requestLog.warning('Network idle timeout reached, proceeding with available DOM...');
        });

        // انتظار تحميل عنصر أساسي بالصفحة لتأكيد رندر البيانات
        await Promise.race([
          page.waitForSelector('[class*="price--"]', { timeout: 8000 }),
          page.waitForSelector('[class*="pdp-info"]', { timeout: 8000 }),
          page.waitForSelector('script:has-text("runParams")', { timeout: 8000 }),
          page.waitForTimeout(5000),
        ]);

        // عمل Scroll خفيف لتشغيل الـ Lazy-loading للصور والـ SKUs
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(1500);

        // استخراج جميع كائنات window المهمة
        const windowObjects = await page.evaluate(() => {
          const res: Record<string, unknown> = {};
          const w = window as unknown as Record<string, unknown>;

          const keys = [
            'runParams',
            '__INITIAL_STATE__',
            '__NEXT_DATA__',
            '_dida_config_',
            '__AEP_DATA__',
            '_init_data_',
          ];

          for (const k of keys) {
            if (w[k]) res[k] = w[k];
          }

          // البحث داخل الـ script tags في الـ DOM مباشرة عن JSON مضمن
          const scripts = Array.from(document.querySelectorAll('script'));
          for (const script of scripts) {
            const text = script.textContent || '';
            if (text.includes('window.runParams') || text.includes('runParams =')) {
              res['_raw_runparams_script'] = text;
            }
            if (text.includes('_init_data_') || text.includes('__AEP_DATA__')) {
              res['_raw_aep_script'] = text;
            }
          }

          return res;
        });

        const html = await page.content();

        const extractionResult = await engine.extract({
          url: extractedUrl,
          html,
          windowObjects,
        });

        const derivedProductId = extractProductIdFromUrl(extractedUrl) || extractProductIdFromUrl(inputUrl);

        const record = formatActorOutput({
          inputUrl,
          extractedUrl,
          extractionResult,
        }) as Record<string, unknown>;

        if (!record.productId && derivedProductId) {
          record.productId = derivedProductId;
        }

        await pushData(record);

        requestLog.info('Product extracted successfully', {
          productId: record.productId,
          title: record.title,
          price: record.price || record.salePrice,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        requestLog.error(`Extraction failed on ${inputUrl}`, { error: message });

        await pushData(
          formatActorErrorOutput({
            inputUrl,
            extractedUrl,
            error: message,
          }) as Record<string, unknown>
        );
      }
    },
  });

  await crawler.run(startUrls);
}