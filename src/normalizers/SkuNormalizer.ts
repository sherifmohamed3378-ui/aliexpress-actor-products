import { isObject, isArray, isString } from '../utils/TypeGuards.js';

import { ImageNormalizer } from './ImageNormalizer.js';
import { PriceNormalizer } from './PriceNormalizer.js';
import { TextNormalizer } from './TextNormalizer.js';

import type { SkuPropertyValue, SkuMappingValue } from '../types/product/Product.js';

export class SkuNormalizer {
  static normalizeProperties(value: unknown): SkuPropertyValue[] | null {
    if (!isArray(value) && !isObject(value)) return null;

    let arr: unknown[] = [];
    if (isArray(value)) arr = value as unknown[];
    else {
      const obj = value as Record<string, unknown>;
      if (isArray(obj['skuProperty'])) arr = obj['skuProperty'] as unknown[];
      else if (isArray(obj['skuProperties'])) arr = obj['skuProperties'] as unknown[];
      else if (isArray(obj['properties'])) arr = obj['properties'] as unknown[];
      else return null;
    }

    const result: SkuPropertyValue[] = [];

    for (const item of arr) {
      if (!isObject(item)) continue;
      const o = item as Record<string, unknown>;

      const idKeys = ['propertyId', 'propId', 'id', 'skuPropertyId', 'pid'];
      let propId: string | null = null;
      for (const k of idKeys) {
        if (o[k] != null) {
          propId = String(o[k]);
          break;
        }
      }
      if (!propId) continue;

      const nameKeys = ['propertyName', 'propName', 'name', 'skuPropertyName', 'text'];
      let propName: string | null = null;
      for (const k of nameKeys) {
        const v = TextNormalizer.normalize(o[k]);
        if (v) {
          propName = v;
          break;
        }
      }
      if (!propName) propName = propId;

      const valuesListRaw = o['values'] ?? o['skuPropertyValues'] ?? o['propertyValues'] ?? o['value'] ?? o['options'];
      let valuesArr: unknown[] = [];
      if (isArray(valuesListRaw)) valuesArr = valuesListRaw as unknown[];
      else if (isObject(valuesListRaw) && isArray((valuesListRaw as Record<string, unknown>)['list'])) {
        valuesArr = (valuesListRaw as Record<string, unknown>)['list'] as unknown[];
      }

      const values = valuesArr
        .map(v => {
          if (isString(v)) return { id: String(v), name: String(v) };
          if (isObject(v)) {
            const vo = v as Record<string, unknown>;
            const vid = String(vo['propertyValueId'] ?? vo['valueId'] ?? vo['id'] ?? vo['propValueId'] ?? '');
            const vname = TextNormalizer.normalize(vo['propertyValueName'] ?? vo['propertyValueDisplayName'] ?? vo['name'] ?? vo['value'] ?? '') ?? vid;
            const image = vo['image'] ?? vo['imgUrl'] ?? vo['imageUrl'] ?? vo['thumbnail'];
            const imgNormalized = image ? ImageNormalizer.normalize(image)?.url : undefined;
            if (imgNormalized) {
              return { id: vid, name: vname, image: imgNormalized };
            }
            return { id: vid, name: vname };
          }
          return null;
        })
        .filter(Boolean) as { id: string; name: string; image?: string }[];

      const mappedValues = values.map(v => {
        if (v.image !== undefined) return v;
        return { id: v.id, name: v.name };
      });

      result.push({ id: propId, name: propName, values: mappedValues });
    }

    return result.length > 0 ? result : null;
  }

  static normalizeMapping(value: unknown): SkuMappingValue[] | null {
    if (!value) return null;

    const entries: Array<{ key: string; value: unknown }> = [];

    if (isObject(value)) {
      const obj = value as Record<string, unknown>;
      for (const [k, v] of Object.entries(obj)) {
        if (k.includes(':') || k.includes(';') || k.includes('#')) {
          entries.push({ key: k, value: v });
        }
      }
      if (entries.length === 0 && isArray(obj['skuMap'])) {
        const list = obj['skuMap'] as unknown[];
        for (const item of list) {
          if (isObject(item)) {
            const o = item as Record<string, unknown>;
            const key = String(o['prop'] ?? o['combination'] ?? o['propertyValueIds'] ?? '');
            entries.push({ key, value: item });
          }
        }
      }
    } else if (isArray(value)) {
      for (const item of value as unknown[]) {
        if (isObject(item)) {
          const o = item as Record<string, unknown>;
          const key = String(o['skuPropIds'] ?? o['propIds'] ?? o['combination'] ?? '');
          entries.push({ key, value: item });
        }
      }
    }

    const result: SkuMappingValue[] = [];

    for (const { key, value: val } of entries) {
      if (!isObject(val)) continue;
      const o = val as Record<string, unknown>;

      const skuId = String(o['skuId'] ?? o['id'] ?? o['sku'] ?? '');
      const priceRaw = o['price'] ?? o['salePrice'] ?? o['skuPrice'] ?? o['actSkuPrice'];
      const price = PriceNormalizer.normalize(priceRaw)?.amount ?? 0;
      const originalRaw = o['originalPrice'] ?? o['retailPrice'];
      const original = PriceNormalizer.normalize(originalRaw)?.amount;
      const stockRaw = o['stock'] ?? o['availQuantity'] ?? o['inventory'] ?? o['quantity'] ?? 0;
      const stock = typeof stockRaw === 'number' ? stockRaw : Number.parseInt(String(stockRaw), 10) || 0;
      const imageRaw = o['image'] ?? o['imgUrl'] ?? o['skuImage'];
      const imageUrl = imageRaw ? ImageNormalizer.normalize(imageRaw)?.url : undefined;

      let base: SkuMappingValue = {
        skuId,
        propertyValueIds: key,
        price,
        stock,
        availability: stock > 0,
      };

      if (original !== undefined) base = { ...base, originalPrice: original };
      if (imageUrl !== undefined) base = { ...base, image: imageUrl };

      result.push(base);
    }

    return result.length > 0 ? result : null;
  }
}
