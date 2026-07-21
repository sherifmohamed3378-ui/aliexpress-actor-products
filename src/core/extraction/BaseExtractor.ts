/**
 * BaseExtractor.ts
 * Abstract base for all extractors. Implements SOLID, DRY, confidence scoring, caching.
 */

import { Cache } from '../../utils/Cache.js';
import { logger, type ILogger } from '../../utils/Logger.js';

import { ConfidenceCalculator } from './Confidence/ConfidenceCalculator.js';
import { SourceProvenanceFactory } from './Confidence/SourceProvenance.js';

import type { ExtractionContext } from './ExtractionContext.js';
import type { IExtractor } from './IExtractor.js';
import type { Field, AlternativeValue } from '../../types/common/Field.js';
import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';


export abstract class BaseExtractor<T> implements IExtractor<T> {
  abstract readonly id: string;
  abstract readonly signals: readonly string[];

  protected readonly confidenceCalculator = new ConfidenceCalculator();
  private readonly extractionCache = new Cache<string, Field<T> | null>(200, 60000);
  private _log?: ILogger;

  constructor() {
    // Do not access abstract id in base constructor - lazy logger
  }

  protected get log(): ILogger {
    if (!this._log) {
      // id is available after subclass construction
      this._log = logger.child(this.id);
    }
    return this._log;
  }

  canExtract(context: ExtractionContext): boolean {
    // Basic heuristic: if any of signals exist in frequency index, we can extract
    const candidates = context.frequencyIndex.findCandidates(this.signals);
    return candidates.length > 0 || context.discovery.sources.length > 0;
  }

  async extract(context: ExtractionContext): Promise<Field<T> | null> {
    const cacheKey = `${context.discovery.url}:${this.id}`;
    const cached = this.extractionCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const start = Date.now();
    try {
      const entries = context.findBySignals(this.signals);
      if (entries.length === 0) {
        this.log.debug(`No entries found for signals`, { signals: this.signals });
        this.extractionCache.set(cacheKey, null);
        return null;
      }

      const candidates = await this.evaluateCandidates(entries, context);

      if (candidates.length === 0) {
        this.extractionCache.set(cacheKey, null);
        return null;
      }

      // Sort by confidence descending
      candidates.sort((a, b) => b.confidence - a.confidence);

      const best = candidates[0];
      if (!best) {
        this.extractionCache.set(cacheKey, null);
        return null;
      }

      const alternatives: AlternativeValue<T>[] = candidates.slice(1, 5).map(c => {
        const baseAlt: AlternativeValue<T> = {
          value: c.value,
          confidence: c.confidence,
          source: c.source,
        };
        const joined = c.metadata.notes?.join(', ');
        if (joined) {
          return { ...baseAlt, reason: joined };
        }
        return baseAlt;
      });

      const baseField: Field<T> = {
        value: best.value,
        source: best.source,
        confidence: best.confidence,
        sourceKey: best.sourceKey,
        metadata: {
          ...best.metadata,
          extractionTimeMs: Date.now() - start,
          alternativesConsidered: candidates.length,
          rawValuePreview: JSON.stringify(best.value).slice(0, 200),
        },
      };

      const field: Field<T> =
        alternatives.length > 0 ? { ...baseField, alternatives } : baseField;

      this.extractionCache.set(cacheKey, field);
      return field;
    } catch (err) {
      this.log.warn(`Extraction failed for ${this.id}`, { error: String(err) });
      this.extractionCache.set(cacheKey, null);
      return null;
    }
  }

  async extractMany(context: ExtractionContext): Promise<readonly Field<T>[]> {
    const entries = context.findBySignals(this.signals);
    const candidates = await this.evaluateCandidates(entries, context);
    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates;
  }

  protected async evaluateCandidates(entries: readonly FoundEntry[], context: ExtractionContext): Promise<Field<T>[]> {
    const results: Field<T>[] = [];

    for (const entry of entries) {
      try {
        const parsed = await this.parseEntry(entry, context);
        if (parsed === null || parsed === undefined) continue;

        const validation = this.validate(parsed);

        // Find which signal matched for confidence calculation
        const matchedSignal = this.findMatchedSignal(entry.key);

        const confidence = this.confidenceCalculator.calculateForEntry(entry, matchedSignal ?? entry.key, validation.isValid);

        if (confidence < 0.1) continue; // Skip very low confidence

        const source = SourceProvenanceFactory.fromFoundEntry(entry, this.id);
        const metadata = SourceProvenanceFactory.createExtractionMetadata({
          traversalDepth: entry.depth,
          validationPassed: validation.isValid,
          ...(validation.normalizations ? { normalizationApplied: validation.normalizations } : { normalizationApplied: [] }),
          ...(validation.notes ? { notes: validation.notes } : {}),
        });

        const field: Field<T> = {
          value: parsed,
          source,
          confidence,
          sourceKey: entry.key,
          metadata,
        };

        results.push(field);
      } catch (err) {
        this.log.debug(`Candidate evaluation failed`, { key: entry.key, path: entry.path, error: String(err) });
      }
    }

    // If multiple candidates have same value, merge confidences
    return this.mergeDuplicateValues(results);
  }

  protected findMatchedSignal(key: string): string | undefined {
    const lowerKey = key.toLowerCase();
    return this.signals.find(s => s.toLowerCase() === lowerKey) ?? this.signals.find(s => lowerKey.includes(s.toLowerCase()));
  }

  protected mergeDuplicateValues(fields: Field<T>[]): Field<T>[] {
    const map = new Map<string, Field<T>[]>();

    for (const f of fields) {
      const key = JSON.stringify(f.value);
      const existing = map.get(key);
      if (existing) existing.push(f);
      else map.set(key, [f]);
    }

    const merged: Field<T>[] = [];
    for (const group of map.values()) {
      if (group.length === 1 && group[0]) {
        merged.push(group[0]);
      } else if (group.length > 1) {
        // Merge confidences - highest wins but boost for agreement
        const confidences = group.map(g => g.confidence);
        const best = [...group].sort((a, b) => b.confidence - a.confidence)[0];
        if (!best) continue;
        const mergedConfidence = this.confidenceCalculator.mergeConfidences(confidences);
        merged.push({ ...best, confidence: mergedConfidence });
      }
    }

    return merged;
  }

  protected abstract parseEntry(entry: FoundEntry, context: ExtractionContext): Promise<T | null> | T | null;

  protected validate(_value: T): { isValid: boolean; notes?: string[]; normalizations?: string[] } {
    return { isValid: true };
  }
}
