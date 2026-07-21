/**
 * PlaywrightCrawler setup for AliExpress product pages.
 */

import { PlaywrightCrawler } from 'crawlee';

import type { ProductExtractionEngine } from '../core/ProductExtractionEngine.js';
import { logger } from '../utils/Logger.js';

import type { ActorInput } from './input.js';
import { formatActorErrorOutput, formatActorOutput } from './output.js';

import type { ProxyConfiguration } from 'crawlee';

const log = logger.child('actor.crawler');

const WINDOW_OBJECT_KEYS = ['runParams', '__INITIAL_STATE__', '__NEXT_DATA__', '_dida_config_'] as const;

export interface ProductCrawlerOptions {
  readonly engine: ProductExtractionEngine;
  readonly input: ActorInput;
  readonly proxyConfiguration?: ProxyConfiguration;
  readonly pushData: (record: Record<string, unknown>) => Promise<void>;
}

async function collectWindowObjects(page: import('playwright').Page): Promise<Record<string, unknown>> {
  return page.evaluate(keys => {
    const result: Record<string, unknown> = {};
    const windowRecord = window as unknown as Record<string, unknown>;
    for (const key of keys) {
      const value = windowRecord[key];
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    }
    return result;
  }, [...WINDOW_OBJECT_KEYS]);
}

/**
 * Creates and runs a PlaywrightCrawler that extracts AliExpress products.
 */
export async function runProductCrawler(options: ProductCrawlerOptions): Promise<void> {
  const { engine, input, proxyConfiguration, pushData } = options;
  const startUrls = input.startUrls.slice(0, input.maxItems);

  log.info('Starting product crawler', {
    urlCount: startUrls.length,
    maxItems: input.maxItems,
    confidenceThreshold: input.confidenceThreshold,
  });

  const crawler = new PlaywrightCrawler({
    ...(proxyConfiguration ? { proxyConfiguration } : {}),
    maxRequestsPerCrawl: input.maxItems,
    maxRequestRetries: 3,
    requestHandler: async ({ request, page, log: requestLog }) => {
      const inputUrl = request.url;
      const extractedUrl = request.loadedUrl ?? request.url;

      requestLog.info(`Extracting product from ${extractedUrl}`);

      try {
        const windowObjects = await collectWindowObjects(page);
        const html = await page.content();

        const extractionResult = await engine.extract({
          url: extractedUrl,
          html,
          windowObjects,
        });

        const record = formatActorOutput({
          inputUrl,
          extractedUrl,
          extractionResult,
        });

        await pushData(record as Record<string, unknown>);

        requestLog.info('Product extracted', {
          productId: extractionResult.product.productId?.value,
          title: extractionResult.product.title?.value,
          fields: extractionResult.performance.fields,
          totalTimeMs: extractionResult.performance.totalTimeMs,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        requestLog.error(`Extraction failed for ${inputUrl}`, { error: message });

        await pushData(
          formatActorErrorOutput({
            inputUrl,
            extractedUrl,
            error: message,
          }) as Record<string, unknown>
        );
      }
    },
    failedRequestHandler: async ({ request, log: requestLog }, error) => {
      const message = error instanceof Error ? error.message : String(error);
      requestLog.error(`Request failed: ${request.url}`, { error: message });

      await pushData(
        formatActorErrorOutput({
          inputUrl: request.url,
          error: message,
        }) as Record<string, unknown>
      );
    },
  });

  await crawler.run(startUrls);
}
