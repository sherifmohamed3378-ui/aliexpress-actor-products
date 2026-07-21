/**
 * MediaExtractor.ts
 * Extracts images, videos, galleries.
 *
 * @module extractors/media
 */

import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { ImageNormalizer } from '../../normalizers/ImageNormalizer.js';
import { UrlNormalizer } from '../../normalizers/UrlNormalizer.js';
import { isArray, isObject, isString } from '../../utils/TypeGuards.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { ImageValue, VideoValue } from '../../types/product/Product.js';

export class ImagesExtractor extends BaseExtractor<readonly ImageValue[]> {
  override readonly id: string = 'images';
  override readonly signals = SIGNAL_DICTIONARY['gallery'] ?? ['images', 'imageList', 'gallery', 'productImages'];

  protected override parseEntry(entry: FoundEntry): readonly ImageValue[] | null {
    const normalized = ImageNormalizer.normalizeArray(entry.value, 'gallery');
    return normalized.length > 0 ? normalized : null;
  }
}

export class MainImageExtractor extends BaseExtractor<ImageValue> {
  override readonly id: string = 'mainImage';
  override readonly signals = ['mainImage', 'bigImage', 'mainImg', 'productImage'] as const;

  protected override parseEntry(entry: FoundEntry): ImageValue | null {
    return ImageNormalizer.normalize(entry.value, 'main');
  }
}

export class GalleryExtractor extends ImagesExtractor {
  override readonly id: string = 'gallery';
}

export class VariantImagesExtractor extends BaseExtractor<readonly ImageValue[]> {
  override readonly id: string = 'variantImages';
  override readonly signals = ['variantImages', 'skuImages', 'propertyImages'] as const;

  protected override parseEntry(entry: FoundEntry): readonly ImageValue[] | null {
    const normalized = ImageNormalizer.normalizeArray(entry.value, 'variant');
    return normalized.length > 0 ? normalized : null;
  }
}

export class SkuImagesExtractor extends VariantImagesExtractor {
  override readonly id: string = 'skuImages';
}

export class VideosExtractor extends BaseExtractor<readonly VideoValue[]> {
  override readonly id: string = 'videos';
  override readonly signals = ['video', 'videos', 'videoModule', 'productVideo', 'videoList'] as const;

  protected override parseEntry(entry: FoundEntry): readonly VideoValue[] | null {
    const v = entry.value;
    let arr: unknown[] = [];
    if (isArray(v)) arr = v as unknown[];
    else if (isString(v)) {
      const url = UrlNormalizer.normalize(v);
      if (!url) return null;
      return [{ url }];
    } else if (isObject(v)) {
      const o = v as Record<string, unknown>;
      if (isArray(o['videos'])) arr = o['videos'] as unknown[];
      else if (isArray(o['list'])) arr = o['list'] as unknown[];
      else if (typeof o['videoUrl'] === 'string') {
        return [{ url: o['videoUrl'] as string }];
      } else {
        arr = [v];
      }
    } else return null;

    const videos: VideoValue[] = arr
      .map(item => {
        if (isString(item)) {
          const url = UrlNormalizer.normalize(item);
          return url ? { url } : null;
        }
        if (isObject(item)) {
          const o = item as Record<string, unknown>;
          const urlRaw = o['url'] ?? o['videoUrl'] ?? o['src'];
          if (typeof urlRaw !== 'string') return null;
          const url = UrlNormalizer.normalize(urlRaw);
          if (!url) return null;
          const thumb = typeof o['thumbnail'] === 'string' ? (o['thumbnail'] as string) : typeof o['thumbUrl'] === 'string' ? (o['thumbUrl'] as string) : undefined;
          const dur = typeof o['duration'] === 'number' ? (o['duration'] as number) : undefined;
          return { url, ...(thumb !== undefined ? { thumbnail: thumb } : {}), ...(dur !== undefined ? { duration: dur } : {}) };
        }
        return null;
      })
      .filter(Boolean) as VideoValue[];

    return videos.length > 0 ? videos : null;
  }
}

export class VideoThumbnailExtractor extends BaseExtractor<string> {
  override readonly id: string = 'videoThumbnail';
  override readonly signals = ['videoThumbnail', 'videoThumb', 'thumbnail', 'videoCover'] as const;

  protected override parseEntry(entry: FoundEntry): string | null {
    return UrlNormalizer.normalize(entry.value);
  }
}

export class VideoDurationExtractor extends BaseExtractor<number> {
  override readonly id: string = 'videoDuration';
  override readonly signals = ['videoDuration', 'duration', 'videoLength'] as const;

  protected override parseEntry(entry: FoundEntry): number | null {
    if (typeof entry.value === 'number') return entry.value;
    if (typeof entry.value === 'string') {
      const n = Number.parseFloat(entry.value);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  }
}
