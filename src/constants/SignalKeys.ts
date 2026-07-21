/**
 * SignalKeys.ts
 * Central registry of JSON key signals for resilient discovery.
 * Never depend on CSS classes - depend on semantic JSON keys that survive frontend rewrites.
 * This is the heart of long-term compatibility.
 */

export const PRODUCT_SIGNALS = {
  title: [
    'subject',
    'title',
    'productTitle',
    'productSubject',
    'itemTitle',
    'product_title',
    'tradeProductTitle',
    'originalTitle',
    'productName',
    'name',
  ],
  subtitle: [
    'subTitle',
    'subtitle',
    'secondTitle',
    'productSubTitle',
    'productSubtitle',
    'shortDescription',
  ],
  productId: [
    'productId',
    'itemId',
    'productID',
    'id',
    'itemID',
    'product_id',
    'goodsId',
    'skuId', // fallback check
  ],
  description: [
    'description',
    'productDescription',
    'detailDesc',
    'productDetail',
    'htmlDescription',
    'descriptionUrl',
  ],
} as const;

export const PRICE_SIGNALS = {
  price: [
    'salePrice',
    'actSkuPrice',
    'actPrice',
    'skuPrice',
    'price',
    'currentPrice',
    'targetPrice',
    'productPrice',
    'minPrice',
    'amount',
    'value',
  ],
  originalPrice: [
    'originalPrice',
    'retailPrice',
    'marketPrice',
    'listPrice',
    'origPrice',
    'originPrice',
    'regularPrice',
  ],
  salePrice: [
    'salePrice',
    'discountPrice',
    'finalPrice',
    'promotionPrice',
    'activityPrice',
    'actSkuPrice',
  ],
  currency: [
    'currency',
    'currencyCode',
    'cur',
    'currencyId',
    'priceCurrency',
  ],
  discount: [
    'discount',
    'discountRate',
    'discountPercent',
    'discountPercentage',
    'offPercent',
    'priceDiscount',
  ],
} as const;

export const IMAGE_SIGNALS = {
  mainImage: [
    'image',
    'mainImage',
    'productImage',
    'bigImage',
    'imageUrl',
    'imagePath',
    'originalImage',
  ],
  gallery: [
    'images',
    'imageList',
    'gallery',
    'productImages',
    'imageModule',
    'imagePathList',
    'summImagePathList',
    'smallImages',
  ],
  video: [
    'video',
    'videoUrl',
    'videoId',
    'videoModule',
    'videoPath',
    'productVideo',
  ],
} as const;

export const SKU_SIGNALS = {
  properties: [
    'skuProperty',
    'skuProperties',
    'productSkuProperty',
    'skuProp',
    'skuProps',
    'propertyList',
    'skuAttr',
  ],
  inventory: [
    'skuInventory',
    'inventory',
    'stock',
    'availQuantity',
    'availableQuantity',
    'quantity',
    'skuStock',
  ],
  priceMapping: [
    'skuPriceList',
    'priceList',
    'skuPrices',
    'skuMap',
    'priceMap',
    'skuInfo',
  ],
  mapping: [
    'skuMap',
    'skuMapping',
    'skuIdMap',
    'propIdMap',
    'skuCompose',
  ],
} as const;

export const SELLER_SIGNALS = {
  storeName: [
    'storeName',
    'sellerName',
    'shopName',
    'store',
    'seller',
  ],
  storeId: [
    'storeId',
    'sellerId',
    'shopId',
    'storeNumId',
    'sellerAdminSeq',
  ],
  storeUrl: [
    'storeUrl',
    'sellerUrl',
    'shopUrl',
    'storeLink',
  ],
  feedback: [
    'positiveRate',
    'positiveFeedback',
    'feedbackRate',
    'sellerPositiveRate',
  ],
} as const;

export const SHIPPING_SIGNALS = {
  shipFrom: [
    'shipFrom',
    'sendFrom',
    'origin',
    'warehouse',
    'dispatchFrom',
    'shipFromCode',
    'shipFromCountry',
  ],
  shipTo: [
    'shipTo',
    'shipToCountry',
    'deliveryTo',
    'toCountry',
  ],
  freight: [
    'freight',
    'shippingFee',
    'freightAmount',
    'deliveryFee',
    'shippingCost',
    'logisticsFee',
  ],
  delivery: [
    'deliveryTime',
    'estimatedDelivery',
    'deliveryDate',
    'leadTime',
    'deliveryRange',
    'eta',
  ],
} as const;

export const RATING_SIGNALS = {
  rating: [
    'averageStar',
    'avgRating',
    'averageRating',
    'rating',
    'starRating',
    'score',
    'productRating',
  ],
  reviewCount: [
    'totalValidNum',
    'reviewCount',
    'feedbackCount',
    '评价数',
    'totalEvaluation',
    'totalReviews',
    'reviewNumber',
    'evaluatedCount',
  ],
  breakdown: [
    'ratingBreakdown',
    'starBreakdown',
    'ratingDistribution',
    'scoreBreakdown',
  ],
} as const;

export const CATEGORY_SIGNALS = {
  category: [
    'category',
    'cate',
    'categoryName',
    'categoryPath',
    'breadcrumb',
    'breadcrumbs',
    'categoryId',
    'productCategory',
  ],
  brand: [
    'brand',
    'brandName',
    'brandId',
    'brandInfo',
  ],
} as const;

export const PROMOTION_SIGNALS = {
  coupon: [
    'coupon',
    'coupons',
    'couponInfo',
    'couponModule',
    'storeCoupon',
  ],
  promotion: [
    'promotion',
    'promotions',
    'activity',
    'promotionModule',
    'marketingInfo',
  ],
  choice: [
    'choice',
    'isChoice',
    'isPlus',
    'plus',
    'choiceMark',
  ],
} as const;

export const ORDERS_SIGNALS = {
  orders: ['tradeCount', 'orders', 'orderNum', 'soldCount', 'sales', 'saleCount', 'totalSold'],
  wishlist: ['wishCount', 'wishlistCount', 'favoriteCount', 'wishedCount', 'collectorCount'],
} as const;

/**
 * Unified signal dictionary - maps logical field -> possible JSON keys
 * Used by ObjectTraverser to resiliently find values regardless of AliExpress frontend version.
 */
export const SIGNAL_DICTIONARY: Record<string, readonly string[]> = {
  // Product
  productTitle: PRODUCT_SIGNALS.title as unknown as readonly string[],
  productSubtitle: PRODUCT_SIGNALS.subtitle as unknown as readonly string[],
  productId: PRODUCT_SIGNALS.productId as unknown as readonly string[],
  description: PRODUCT_SIGNALS.description as unknown as readonly string[],

  // Price
  price: PRICE_SIGNALS.price as unknown as readonly string[],
  originalPrice: PRICE_SIGNALS.originalPrice as unknown as readonly string[],
  salePrice: PRICE_SIGNALS.salePrice as unknown as readonly string[],
  currency: PRICE_SIGNALS.currency as unknown as readonly string[],
  discount: PRICE_SIGNALS.discount as unknown as readonly string[],

  // Media
  mainImage: IMAGE_SIGNALS.mainImage as unknown as readonly string[],
  gallery: IMAGE_SIGNALS.gallery as unknown as readonly string[],
  video: IMAGE_SIGNALS.video as unknown as readonly string[],

  // SKU
  skuProperties: SKU_SIGNALS.properties as unknown as readonly string[],
  skuInventory: SKU_SIGNALS.inventory as unknown as readonly string[],
  skuPriceList: SKU_SIGNALS.priceMapping as unknown as readonly string[],
  skuMapping: SKU_SIGNALS.mapping as unknown as readonly string[],

  // Seller
  storeName: SELLER_SIGNALS.storeName as unknown as readonly string[],
  storeId: SELLER_SIGNALS.storeId as unknown as readonly string[],
  storeUrl: SELLER_SIGNALS.storeUrl as unknown as readonly string[],
  feedback: SELLER_SIGNALS.feedback as unknown as readonly string[],

  // Shipping
  shipFrom: SHIPPING_SIGNALS.shipFrom as unknown as readonly string[],
  shipTo: SHIPPING_SIGNALS.shipTo as unknown as readonly string[],
  freight: SHIPPING_SIGNALS.freight as unknown as readonly string[],
  delivery: SHIPPING_SIGNALS.delivery as unknown as readonly string[],

  // Rating
  rating: RATING_SIGNALS.rating as unknown as readonly string[],
  reviewCount: RATING_SIGNALS.reviewCount as unknown as readonly string[],
  breakdown: RATING_SIGNALS.breakdown as unknown as readonly string[],

  // Category / Brand
  category: CATEGORY_SIGNALS.category as unknown as readonly string[],
  brand: CATEGORY_SIGNALS.brand as unknown as readonly string[],

  // Promotions
  coupon: PROMOTION_SIGNALS.coupon as unknown as readonly string[],
  promotion: PROMOTION_SIGNALS.promotion as unknown as readonly string[],
  choice: PROMOTION_SIGNALS.choice as unknown as readonly string[],

  // Orders
  orders: ORDERS_SIGNALS.orders as unknown as readonly string[],
  wishlist: ORDERS_SIGNALS.wishlist as unknown as readonly string[],
};

export const HIGH_PRIORITY_KEYS = new Set<string>([
  ...PRODUCT_SIGNALS.title,
  ...PRODUCT_SIGNALS.productId,
  ...PRICE_SIGNALS.price,
  ...IMAGE_SIGNALS.gallery,
  ...SKU_SIGNALS.properties,
]);

/**
 * Keys that strongly indicate a product detail object, used for network response discovery.
 */
export const PRODUCT_CONTAINER_INDICATORS: readonly string[] = [
  'productId',
  'subject',
  'salePrice',
  'skuProperty',
  'imageModule',
  'tradeModule',
] as const;
