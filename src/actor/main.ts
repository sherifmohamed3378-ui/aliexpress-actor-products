/**
 * Apify Actor entry point.
 *
 * Flow:
 * Actor.init → read input → ProductExtractionEngine → PlaywrightCrawler → pushData → Actor.exit
 */

import { Actor } from 'apify';

import { ProductExtractionEngine } from '../core/ProductExtractionEngine.js';
import { EngineConfigFactory } from '../core/config/EngineConfig.js';
import { logger } from '../utils/Logger.js';

import { runProductCrawler } from './crawler.js';
import { parseActorInput } from './input.js';

const log = logger.child('actor.main');

async function main(): Promise<void> {
  await Actor.init();

  try {
    const rawInput = await Actor.getInput();
    const input = parseActorInput(rawInput);

    log.info('Actor started', {
      startUrlCount: input.startUrls.length,
      maxItems: input.maxItems,
      confidenceThreshold: input.confidenceThreshold,
      includeRawData: input.includeRawData,
      hasProxy: Boolean(input.proxyConfiguration),
    });

    const engine = new ProductExtractionEngine({
      ...EngineConfigFactory.forApify(),
      confidenceThreshold: input.confidenceThreshold,
      includeRawData: input.includeRawData,
    });

    const proxyConfiguration = input.proxyConfiguration
      ? await Actor.createProxyConfiguration(input.proxyConfiguration)
      : undefined;

    await runProductCrawler({
      engine,
      input,
      ...(proxyConfiguration ? { proxyConfiguration } : {}),
      pushData: async record => {
        await Actor.pushData(record);
      },
    });

    log.info('Actor run completed successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('Actor run failed', { error: message });
    throw err;
  } finally {
    await Actor.exit();
  }
}

await main();
