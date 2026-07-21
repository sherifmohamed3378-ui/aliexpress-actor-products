import { isObject, isArray, isString } from '../utils/TypeGuards.js';

import { TextNormalizer } from './TextNormalizer.js';

import type { BreadcrumbValue, CategoryValue } from '../types/product/Product.js';

export class CategoryNormalizer {
  static normalizeCategory(value: unknown): CategoryValue | null {
    if (!value) return null;

    if (isString(value)) {
      const name = TextNormalizer.normalize(value);
      if (!name) return null;
      return { name };
    }

    if (isObject(value)) {
      const obj = value as Record<string, unknown>;
      const nameKeys = ['name', 'categoryName', 'title', 'text', 'label'];
      let name: string | null = null;
      for (const k of nameKeys) {
        const v = obj[k];
        const n = TextNormalizer.normalize(v);
        if (n) {
          name = n;
          break;
        }
      }
      if (!name) return null;

      let id: string | undefined;
      if (typeof obj['id'] === 'string' || typeof obj['id'] === 'number') id = String(obj['id']);
      else if (typeof obj['categoryId'] === 'string') id = obj['categoryId'] as string;
      else if (typeof obj['categoryId'] === 'number') id = String(obj['categoryId']);

      let url: string | undefined;
      if (typeof obj['url'] === 'string') url = obj['url'] as string;
      else if (typeof obj['link'] === 'string') url = obj['link'] as string;

      const base: CategoryValue = { name };
      if (id !== undefined) {
        return url !== undefined ? { name, id, url } : { name, id };
      }
      if (url !== undefined) {
        return { name, url };
      }
      return base;
    }

    return null;
  }

  static normalizeBreadcrumbs(value: unknown): BreadcrumbValue[] | null {
    if (!value) return null;

    let arr: unknown[] = [];
    if (isArray(value)) arr = value as unknown[];
    else if (isObject(value)) {
      const obj = value as Record<string, unknown>;
      if (isArray(obj['breadcrumbs'])) arr = obj['breadcrumbs'] as unknown[];
      else if (isArray(obj['breadcrumb'])) arr = obj['breadcrumb'] as unknown[];
      else if (isArray(obj['path'])) arr = obj['path'] as unknown[];
      else if (isArray(obj['list'])) arr = obj['list'] as unknown[];
      else return null;
    } else if (isString(value)) {
      const parts = (value as string).split(/[>›/]/).map(s => s.trim()).filter(Boolean);
      return parts.map((p, idx) => ({ name: p, level: idx }));
    } else return null;

    const result: BreadcrumbValue[] = [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (isString(item)) {
        result.push({ name: item, level: i });
      } else if (isObject(item)) {
        const obj = item as Record<string, unknown>;
        const name = TextNormalizer.normalize(obj['name'] ?? obj['title'] ?? obj['text'] ?? obj['categoryName']);
        if (!name) continue;

        let id: string | undefined;
        if (obj['id'] != null) id = String(obj['id']);
        else if (obj['categoryId'] != null) id = String(obj['categoryId']);

        let url: string | undefined;
        if (typeof obj['url'] === 'string') url = obj['url'] as string;
        else if (typeof obj['link'] === 'string') url = obj['link'] as string;

        if (id !== undefined && url !== undefined) {
          result.push({ name, id, url, level: i });
        } else if (id !== undefined) {
          result.push({ name, id, level: i });
        } else if (url !== undefined) {
          result.push({ name, url, level: i });
        } else {
          result.push({ name, level: i });
        }
      }
    }

    return result.length > 0 ? result : null;
  }
}
