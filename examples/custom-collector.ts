/**
 * Custom collector example - add GraphQL discovery
 */
import { ProductExtractionEngine, CompositeCollector } from '../src/index.js';
import type { ICollector, ICollectionContext } from '../src/index.js';
import type { RawDataSource } from '../src/index.js';
import { SourceType } from '../src/index.js';

class GraphQLCollector implements ICollector {
  readonly id = 'GraphQLCollector';

  canCollect(context: ICollectionContext): boolean {
    return !!context.html?.includes('graphql') || !!context.windowObjects;
  }

  async collect(context: ICollectionContext): Promise<readonly RawDataSource[]> {
    // Example: look for GraphQL payloads containing product data
    const sources: RawDataSource[] = [];

    if (context.networkResponses) {
      for (const resp of context.networkResponses) {
        if (resp.url.includes('graphql') && typeof resp.body === 'object') {
          sources.push({
            id: `graphql.${resp.url}`,
            type: SourceType.NETWORK_RESPONSE,
            data: resp.body,
            url: resp.url,
            timestamp: Date.now(),
            sizeBytes: JSON.stringify(resp.body).length,
            collectorId: this.id,
          });
        }
      }
    }

    return sources;
  }
}

async function main(): Promise<void> {
  const customCollector = new CompositeCollector([
    // Default collectors would be here, plus custom
    new GraphQLCollector() as never,
  ]);

  // You can pass custom collector to engine via pipeline stages
  // For simplicity, just demonstrate collector standalone
  const result = await customCollector.collect({
    url: 'https://www.aliexpress.com/item/123.html',
    html: '<html>graphql data</html>',
    networkResponses: [{ url: 'https://example.com/graphql', body: { productId: '123', subject: 'Test' } }],
  });

  console.log('Collected sources:', result.sources.length);
}

main().catch(console.error);
