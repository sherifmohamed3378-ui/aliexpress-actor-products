import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';
import type { DiscoveryContext } from '../../../types/discovery/DiscoveryTypes.js';

export interface ICollectionContext {
  readonly url: string;
  readonly html?: string;
  readonly windowObjects?: Record<string, unknown>;
  readonly networkResponses?: readonly { url: string; body: unknown }[];
  readonly headers?: Record<string, string>;
}

export interface ICollector {
  readonly id: string;
  collect(context: ICollectionContext): Promise<readonly RawDataSource[]>;
  canCollect(context: ICollectionContext): boolean;
}
