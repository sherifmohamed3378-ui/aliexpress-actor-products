/**
 * ExtractorRegistry.ts
 * Registry for all extractors, dependency injection friendly.
 */

import { logger } from '../../utils/Logger.js';

import type { ExtractionContext } from './ExtractionContext.js';
import type { IExtractor } from './IExtractor.js';
import type { Field } from '../../types/common/Field.js';


export class ExtractorRegistry {
  private readonly extractors = new Map<string, IExtractor<unknown>>();
  private readonly log = logger.child('ExtractorRegistry');

  register<T>(extractor: IExtractor<T>): void {
    if (this.extractors.has(extractor.id)) {
      this.log.warn(`Extractor ${extractor.id} already registered, overwriting`);
    }
    this.extractors.set(extractor.id, extractor as IExtractor<unknown>);
    this.log.debug(`Registered extractor ${extractor.id}`);
  }

  registerMany(extractors: readonly IExtractor<unknown>[]): void {
    for (const ext of extractors) this.register(ext);
  }

  get(id: string): IExtractor<unknown> | undefined {
    return this.extractors.get(id);
  }

  getAll(): readonly IExtractor<unknown>[] {
    return Array.from(this.extractors.values());
  }

  async extractAll(context: ExtractionContext): Promise<Map<string, Field<unknown> | null>> {
    const results = new Map<string, Field<unknown> | null>();
    const extractors = this.getAll();

    this.log.info(`Running ${extractors.length} extractors`);

    for (const extractor of extractors) {
      try {
        if (!extractor.canExtract(context)) {
          this.log.debug(`Extractor ${extractor.id} cannot extract for this context`);
          results.set(extractor.id, null);
          continue;
        }

        const field = await extractor.extract(context);
        results.set(extractor.id, field);
        this.log.debug(`Extractor ${extractor.id} result`, {
          hasValue: !!field,
          confidence: field?.confidence,
        });
      } catch (err) {
        this.log.warn(`Extractor ${extractor.id} failed`, { error: String(err) });
        results.set(extractor.id, null);
      }
    }

    return results;
  }

  size(): number {
    return this.extractors.size;
  }

  clear(): void {
    this.extractors.clear();
  }
}
