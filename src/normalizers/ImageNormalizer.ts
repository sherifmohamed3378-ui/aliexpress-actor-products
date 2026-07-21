import { isObject, isString } from '../utils/TypeGuards.js';
import { UrlUtils } from '../utils/UrlUtils.js';

import { UrlNormalizer } from './UrlNormalizer.js';

import type { ImageValue } from '../types/product/Product.js';

export class ImageNormalizer {
  static normalize(value: unknown, type?: ImageValue['type']): ImageValue | null {
    if (value == null) return null;

    if (isString(value)) {
      const url = UrlNormalizer.normalize(value);
      if (!url) return null;
      const base: ImageValue = { url: UrlUtils.ensureHttps(url) };
      return type !== undefined ? { ...base, type } : base;
    }

    if (isObject(value)) {
      const obj = value as Record<string, unknown>;

      const urlKeys = ['url', 'imageUrl', 'image', 'path', 'imagePath', 'originalImage', 'bigImage', 'src', 'thumbnail', 'thumbUrl'];
      for (const key of urlKeys) {
        const candidate = obj[key];
        if (isString(candidate)) {
          const url = UrlNormalizer.normalize(candidate);
          if (url) {
            let result: ImageValue = { url: UrlUtils.ensureHttps(url) };
            if (typeof obj['width'] === 'number') {
              result = { ...result, width: obj['width'] as number };
            }
            if (typeof obj['height'] === 'number') {
              result = { ...result, height: obj['height'] as number };
            }
            if (type !== undefined) {
              result = { ...result, type };
            }
            return result;
          }
        }
      }

      if ('image' in obj && isString(obj['image'])) {
        const url = UrlNormalizer.normalize(obj['image'] as string);
        if (url) {
          const base: ImageValue = { url: UrlUtils.ensureHttps(url) };
          return type !== undefined ? { ...base, type } : base;
        }
      }
    }

    return null;
  }

  static normalizeArray(values: unknown, type?: ImageValue['type']): ImageValue[] {
    if (!values) return [];

    let arr: unknown[];
    if (Array.isArray(values)) arr = values;
    else if (isObject(values)) {
      const obj = values as Record<string, unknown>;
      const possibleLists = ['images', 'imageList', 'list', 'pathList', 'imagePathList', 'summImagePathList', 'smallImageList', 'gallery'];
      let found: unknown[] | undefined;
      for (const k of possibleLists) {
        if (Array.isArray(obj[k])) {
          found = obj[k] as unknown[];
          break;
        }
      }
      arr = found ?? [values];
    } else {
      arr = [values];
    }

    const result: ImageValue[] = [];
    const seen = new Set<string>();

    for (const v of arr) {
      if (Array.isArray(v)) {
        for (const sub of v) {
          const normalized = this.normalize(sub, type);
          if (normalized && !seen.has(normalized.url)) {
            seen.add(normalized.url);
            result.push(normalized);
          }
        }
      } else {
        const normalized = this.normalize(v, type);
        if (normalized && !seen.has(normalized.url)) {
          seen.add(normalized.url);
          result.push(normalized);
        }
      }
    }

    return result;
  }
}
