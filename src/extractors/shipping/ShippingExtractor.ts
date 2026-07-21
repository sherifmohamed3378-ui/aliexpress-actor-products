import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { PriceNormalizer } from '../../normalizers/PriceNormalizer.js';
import { TextNormalizer } from '../../normalizers/TextNormalizer.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { PriceValue, ShippingMethodValue } from '../../types/product/Product.js';


export class ShipFromExtractor extends BaseExtractor<string> {
  override readonly id: string = 'shipFrom';
  override readonly signals = ['shipFrom', 'sendFrom', 'origin', 'warehouse', 'dispatchFrom', 'shipFromCountry'] as const;
  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}

export class ShipsToExtractor extends BaseExtractor<readonly string[]> {
  override readonly id: string = 'shipsTo';
  override readonly signals = ['shipTo', 'shipsTo', 'deliveryTo', 'shipToCountry'] as const;
  protected override parseEntry(entry: FoundEntry): readonly string[] | null {
    const v = entry.value;
    if (typeof v === 'string') return [v];
    if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      if (Array.isArray(obj['countries'])) return (obj['countries'] as unknown[]).map(x => String(x));
      if (typeof obj['country'] === 'string') return [obj['country'] as string];
    }
    return null;
  }
}

export class EstimatedDeliveryExtractor extends BaseExtractor<string> {
  override readonly id: string = 'estimatedDelivery';
  override readonly signals = ['estimatedDelivery', 'deliveryTime', 'deliveryDate', 'eta', 'leadTime'] as const;
  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}

export class DeliveryRangeExtractor extends BaseExtractor<{ min: string; max: string }> {
  override readonly id: string = 'deliveryRange';
  override readonly signals = ['deliveryRange', 'deliveryTimeRange', 'etaRange'] as const;
  protected override parseEntry(entry: FoundEntry): { min: string; max: string } | null {
    const v = entry.value;
    if (typeof v === 'string') {
      const parts = v.split('-').map(s => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) return { min: parts[0], max: parts[1] };
      return { min: v, max: v };
    }
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      const min = TextNormalizer.normalize(obj['min'] ?? obj['from'] ?? obj['start']);
      const max = TextNormalizer.normalize(obj['max'] ?? obj['to'] ?? obj['end']);
      if (min && max) return { min, max };
    }
    return null;
  }
}

export class ShippingCompaniesExtractor extends BaseExtractor<readonly string[]> {
  override readonly id: string = 'shippingCompanies';
  override readonly signals = ['shippingCompanies', 'logisticsCompany', 'carrier', 'deliveryCompany'] as const;
  protected override parseEntry(entry: FoundEntry): readonly string[] | null {
    const v = entry.value;
    if (typeof v === 'string') return [v];
    if (Array.isArray(v)) return v.map(x => String(x));
    return null;
  }
}

export class ShippingCostExtractor extends BaseExtractor<PriceValue> {
  override readonly id: string = 'shippingCost';
  override readonly signals = ['freight', 'shippingFee', 'freightAmount', 'deliveryFee', 'shippingCost', 'logisticsFee'] as const;
  protected override parseEntry(entry: FoundEntry): PriceValue | null {
    const normalized = PriceNormalizer.normalize(entry.value);
    if (!normalized) return null;
    return normalized;
  }
}

export class ShippingCurrencyExtractor extends BaseExtractor<string> {
  override readonly id: string = 'shippingCurrency';
  override readonly signals = ['freightCurrency', 'shippingCurrency'] as const;
  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}

export class ShippingMethodsExtractor extends BaseExtractor<readonly ShippingMethodValue[]> {
  override readonly id: string = 'shippingMethods';
  override readonly signals = ['shippingMethods', 'freightList', 'logisticsList', 'deliveryMethods', 'shippingOptions'] as const;
  protected override parseEntry(entry: FoundEntry): readonly ShippingMethodValue[] | null {
    const v = entry.value;
    let arr: unknown[] = [];
    if (Array.isArray(v)) arr = v as unknown[];
    else if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      if (Array.isArray(obj['list'])) arr = obj['list'] as unknown[];
      else if (Array.isArray(obj['methods'])) arr = obj['methods'] as unknown[];
      else arr = [v];
    }

    const methods: ShippingMethodValue[] = arr.map(item => {
      if (typeof item === 'object' && item !== null) {
        const o = item as Record<string, unknown>;
        const company = TextNormalizer.normalize(o['company'] ?? o['carrier'] ?? o['logisticsCompany'] ?? o['name']) ?? 'Unknown';
        const cost = PriceNormalizer.normalize(o['cost'] ?? o['freight'] ?? o['fee'] ?? o['price'])?.amount ?? 0;
        const currencyRaw = o['currency'] ?? o['freightCurrency'] ?? 'USD';
        const currency = typeof currencyRaw === 'string' ? currencyRaw : 'USD';
        const estimated = TextNormalizer.normalize(o['estimatedDelivery'] ?? o['deliveryTime'] ?? o['eta']) ?? undefined;
        return { company, cost, currency, estimatedDelivery: estimated };
      }
      return null;
    }).filter(Boolean) as ShippingMethodValue[];

    return methods.length > 0 ? methods : null;
  }
}
