# Deprecated Files

**Deprecation Date:** December 28, 2025
**Phase:** 6 - Cleanup & Finalization

## Why These Files Were Deprecated

These files were part of the old variant/color/size system that has been replaced by the unified **Product Options & Combinations** system.

### Old System (Deprecated)
- Separate tables: `product_colors`, `product_sizes`, `product_variants`
- Limited to only color and size options
- Fixed option types

### New System (Active)
- Unified tables: `product_option_types`, `product_option_values`, `product_option_combinations`
- Unlimited option types (Color, Size, Material, Flavor, etc.)
- Dynamic filtering based on product category
- Combination-based stock and pricing

## Deprecated Files

### Models
- `variant.model.js` - Product variant operations
- `color.model.js` - Color management
- `size.model.js` - Size management

### Controllers
- `variant.controller.js` - Variant API handlers
- `color.controller.js` - Color API handlers
- `size.controller.js` - Size API handlers

### Services
- `variant.service.js` - Variant business logic
- `color.service.js` - Color business logic
- `size.service.js` - Size business logic

### Routes
- `variant.routes.js` - `/api/variants` endpoints
- `color.routes.js` - `/api/colors` endpoints
- `size.routes.js` - `/api/sizes` endpoints

## Replacement APIs

| Old Endpoint | New Endpoint |
|-------------|--------------|
| GET /api/colors | GET /api/public/filters/options |
| GET /api/sizes | GET /api/public/filters/options |
| GET /api/variants/product/:id | GET /api/option-combinations/product/:id |
| POST /api/variants | POST /api/option-combinations |

## Related Migrations

1. `20251228_003_phase6_backup_deprecated.sql` - Backup old data
2. `20251228_004_phase6_drop_deprecated.sql` - Drop old tables

## Can I Delete These Files?

Yes, after confirming:
1. All data has been migrated to the new system
2. The backup migration has been run
3. No code references these files anymore

To delete:
```bash
rm -rf backend/_deprecated
```
