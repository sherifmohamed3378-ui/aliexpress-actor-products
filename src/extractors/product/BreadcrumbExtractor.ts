import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { CategoryNormalizer } from '../../normalizers/CategoryNormalizer.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { BreadcrumbValue } from '../../types/product/Product.js';

export class BreadcrumbExtractor extends BaseExtractor<readonly BreadcrumbValue[]> {
  override readonly id: string = 'breadcrumbs';
  override readonly signals = ['breadcrumbs', 'breadcrumb', 'categoryPath', 'breadcrumbList', 'categoryTree'] as const;
  protected override parseEntry(entry: FoundEntry): readonly BreadcrumbValue[] | null {
    return CategoryNormalizer.normalizeBreadcrumbs(entry.value);
  }
}
