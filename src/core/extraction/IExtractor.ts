import type { ExtractionContext } from './ExtractionContext.js';
import type { Field } from '../../types/common/Field.js';

export interface IExtractor<T = unknown> {
  readonly id: string;
  readonly signals: readonly string[];
  extract(context: ExtractionContext): Promise<Field<T> | null>;
  extractMany(context: ExtractionContext): Promise<readonly Field<T>[]>;
  canExtract(context: ExtractionContext): boolean;
}

export interface BatchExtractor<T = unknown> {
  readonly id: string;
  extract(context: ExtractionContext): Promise<Record<string, Field<unknown> | null>>;
}
