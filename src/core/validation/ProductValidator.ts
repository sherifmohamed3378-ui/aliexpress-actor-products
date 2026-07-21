/**
 * ProductValidator.ts
 * Validates final product extraction result.
 *
 * @module core/validation
 */

import type { AliExpressProduct } from '../../types/product/Product.js';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export class ProductValidator {
  validate(product: AliExpressProduct): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Title should exist
    if (!product.title) {
      warnings.push('Missing title');
    } else if (product.title.confidence < 0.5) {
      warnings.push(`Low confidence title: ${product.title.confidence}`);
    }

    if (!product.productId) {
      warnings.push('Missing productId');
    }

    // Price validation
    if (product.price?.value) {
      const amount = product.price.value.amount;
      if (amount <= 0) errors.push('Invalid price amount');
      if (amount > 1_000_000) warnings.push('Suspiciously high price');
    }

    // Discount consistency
    if (product.price?.value && product.originalPrice?.value) {
      if (product.price.value.amount > product.originalPrice.value.amount) {
        warnings.push('Sale price higher than original price');
      }
    }

    // Images
    if (!product.images && !product.gallery && !product.mainImage) {
      warnings.push('No images extracted');
    }

    // Review sanity
    if (product.averageRating?.value) {
      const r = product.averageRating.value;
      if (r < 0 || r > 5) errors.push(`Invalid rating ${r}`);
    }

    // Stock
    if (product.stock?.value != null && product.stock.value < 0) {
      errors.push('Negative stock');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export class FieldValidator {
  static isValidStringField(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  static isValidNumberField(value: unknown): boolean {
    return typeof value === 'number' && !Number.isNaN(value);
  }

  static isValidPriceField(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return typeof obj['amount'] === 'number' && (obj['amount'] as number) > 0;
  }
}
