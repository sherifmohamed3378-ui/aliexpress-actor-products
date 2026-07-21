/**
 * SpecificationExtractor.ts
 * Extracts product specifications, attributes, dimensions, etc.
 *
 * @module extractors/specifications
 */

import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { TextNormalizer } from '../../normalizers/TextNormalizer.js';
import { isArray, isObject } from '../../utils/TypeGuards.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { SpecificationValue } from '../../types/product/Product.js';

function parseSpecArray(value: unknown): SpecificationValue[] | null {
  let arr: unknown[] = [];
  if (isArray(value)) arr = value as unknown[];
  else if (isObject(value)) {
    const o = value as Record<string, unknown>;
    if (isArray(o['specs'])) arr = o['specs'] as unknown[];
    else if (isArray(o['attributes'])) arr = o['attributes'] as unknown[];
    else if (isArray(o['list'])) arr = o['list'] as unknown[];
    else if (isArray(o['properties'])) arr = o['properties'] as unknown[];
    else return null;
  } else return null;

  const result: SpecificationValue[] = arr
    .map(item => {
      if (isObject(item)) {
        const o = item as Record<string, unknown>;
        const name = TextNormalizer.normalize(o['name'] ?? o['key'] ?? o['title'] ?? o['propName']);
        const val = TextNormalizer.normalize(o['value'] ?? o['val'] ?? o['propValue']);
        if (!name || !val) return null;
        return { name, value: val };
      }
      return null;
    })
    .filter(Boolean) as SpecificationValue[];

  return result.length > 0 ? result : null;
}

export class SpecificationsExtractor extends BaseExtractor<readonly SpecificationValue[]> {
  override readonly id: string = 'specifications';
  override readonly signals = ['specifications', 'specs', 'productSpecs', 'propertyList'] as const;

  protected override parseEntry(entry: FoundEntry): readonly SpecificationValue[] | null {
    return parseSpecArray(entry.value);
  }
}

export class AttributesExtractor extends BaseExtractor<readonly SpecificationValue[]> {
  override readonly id: string = 'attributes';
  override readonly signals = ['attributes', 'attrs', 'productAttributes', 'propertyList'] as const;

  protected override parseEntry(entry: FoundEntry): readonly SpecificationValue[] | null {
    return parseSpecArray(entry.value);
  }
}

export class PackageContentsExtractor extends BaseExtractor<readonly string[]> {
  override readonly id: string = 'packageContents';
  override readonly signals = ['packageContents', 'packageList', 'included', 'boxContents'] as const;

  protected override parseEntry(entry: FoundEntry): readonly string[] | null {
    if (isArray(entry.value)) return (entry.value as unknown[]).map(v => String(v)).filter(Boolean);
    if (typeof entry.value === 'string') {
      return entry.value.split(/[,;]\s*/).map(s => s.trim()).filter(Boolean);
    }
    return null;
  }
}

export class DimensionsExtractor extends BaseExtractor<string> {
  override readonly id: string = 'dimensions';
  override readonly signals = ['dimensions', 'size', 'productDimensions', 'packageDimensions'] as const;

  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}

export class WeightExtractor extends BaseExtractor<string> {
  override readonly id: string = 'weight';
  override readonly signals = ['weight', 'productWeight', 'packageWeight', 'shippingWeight'] as const;

  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}
