# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-21

### Added
- Initial enterprise-grade release
- Recursive object discovery engine with cycle detection
- Deep object indexing for O(1) signal lookups
- 9 collector strategies: WindowObject, EmbeddedJson, HydrationState, NetworkResponse, MetaTag, LdJson, DomFallback, Composite
- Confidence scoring system with source provenance
- 50+ extractors covering:
  - Product identifiers, title, category, breadcrumbs, brand
  - Pricing, currency, discounts, coupons, promotions
  - Badges (Choice, Plus, TopBrand)
  - Inventory, stock, availability, warehouse
  - Orders, sales, wishlist
  - Shipping, delivery, freight
  - Seller/store information
  - Ratings, reviews, breakdown
  - Media: images, gallery, variant images, videos
  - Specifications, attributes, dimensions, weight
  - SKU properties, mapping, inventory, prices
- Pipeline architecture: Collection → Indexing → Extraction → Merging → Normalization → Validation
- Result merger with highest-confidence-wins and alternative preservation
- Product validator
- Normalizers for text, price, URL, image, category, rating, SKU, HTML
- Utilities: SafeJsonParser, Logger, Cache, Memoizer, TypeGuards, StringUtils, UrlUtils
- Engine config with performance modes: fast, balanced, thorough
- Apify Actor integration with PlaywrightCrawler
- Comprehensive TypeScript strict mode compliance
- Full public API exports

### Architecture
- SOLID, DRY, KISS principles
- Composition over inheritance
- Dependency injection friendly
- Pure functions where possible
- Zero hardcoded CSS selectors
- Zero hardcoded API endpoints
- Survives AliExpress frontend changes via signal dictionary

### Performance
- Indexed lookups avoid repeated recursive searches
- WeakSet cycle detection prevents infinite loops
- Memoization cache for traversal results
- Configurable depth and key limits

## [Unreleased]
- Planned: GraphQL discovery collector
- Planned: Review sentiment analysis
- Planned: Multi-language normalization
