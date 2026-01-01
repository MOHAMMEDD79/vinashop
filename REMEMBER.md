# VinaShop - System Refactoring Plan

## Document Created: December 28, 2025
## Status: IN PROGRESS - Phase 1

---

# PROBLEM ANALYSIS

## Issue 1: Duplicate Color Data

### Current State:
```
TABLE: product_colors (8 records)
├── color_id: 1 → "Black" (#000000)
├── color_id: 2 → "Silver" (#C0C0C0)
├── color_id: 3 → "Gold" (#FFD700)
├── color_id: 4 → "Red" (#FF0000)
├── color_id: 5 → "Blue" (#0000FF)
├── color_id: 6 → "Green" (#008000)
├── color_id: 7 → "Rose Gold" (#B76E79)
└── color_id: 8 → "White" (#FFFFFF)

TABLE: product_option_values (type_id=5 "Color") (10 records)
├── option_value_id: 20 → "Black"
├── option_value_id: 21 → "White"
├── option_value_id: 22 → "Red"
├── option_value_id: 23 → "Blue"
├── option_value_id: 24 → "Green"
├── option_value_id: 25 → "Gold" (+₪10)
├── option_value_id: 26 → "Silver" (+₪5)
├── option_value_id: 27 → "Pink"
├── option_value_id: 28 → "Purple"
└── option_value_id: 29 → "Orange"
```

### Problem:
- Same colors stored in TWO different tables
- `product_variants` uses `product_colors.color_id`
- `product_options` uses `product_option_values.option_value_id`
- Frontend filters use old `product_colors` system

---

## Issue 2: Duplicate Size Data

### Current State:
```
TABLE: product_sizes (4 records)
├── size_id: 1 → "Small" (45cm)
├── size_id: 2 → "Medium" (55cm)
├── size_id: 3 → "Large" (70cm)
└── size_id: 4 → "XL" (85cm)

TABLE: product_option_values (type_id=3 "Size") (3 records)
├── option_value_id: 9 → "30ml"
├── option_value_id: 10 → "60ml" (+₪10)
└── option_value_id: 11 → "100ml" (+₪20)
```

### Problem:
- Two separate size systems with different data
- No unified size management

---

## Issue 3: Variants vs Options Architecture Conflict

### product_variants Table:
```sql
CREATE TABLE product_variants (
  variant_id INT PRIMARY KEY,
  product_id INT,           -- Links to product
  color_id INT,             -- Links to product_colors (OLD)
  size_id INT,              -- Links to product_sizes (OLD)
  additional_price DECIMAL, -- Price modifier
  stock_quantity INT,       -- Stock per variant
  sku VARCHAR(100)          -- Unique SKU
);
```

### product_options System:
```sql
-- Option Types (e.g., Color, Size, Flavor, Strength)
CREATE TABLE product_option_types (
  option_type_id INT PRIMARY KEY,
  type_name_en/ar/he VARCHAR,
  display_order INT,
  is_active BOOLEAN
);

-- Option Values (e.g., Red, Blue, 30ml, 60ml)
CREATE TABLE product_option_values (
  option_value_id INT PRIMARY KEY,
  option_type_id INT,       -- Links to type
  value_name_en/ar/he VARCHAR,
  additional_price DECIMAL, -- Price modifier
  display_order INT,
  is_active BOOLEAN
);

-- Product-Option Links
CREATE TABLE product_options (
  product_option_id INT PRIMARY KEY,
  product_id INT,
  option_type_id INT,
  is_required BOOLEAN,
  display_order INT
);
```

### Comparison:
| Feature | product_variants | product_options |
|---------|-----------------|-----------------|
| Option Types | ONLY Color + Size | UNLIMITED types |
| Stock Tracking | YES (per variant) | NO (missing!) |
| SKU per combination | YES | NO (missing!) |
| Price modifiers | YES | YES |
| Flexibility | LIMITED | FLEXIBLE |

---

## Issue 4: Hybrid Data in Orders/Cart

### cart_items Table:
```sql
cart_item_id, user_id, product_id,
variant_id INT,                    -- OLD system
selected_options JSON              -- NEW system (already used!)
-- Example: [{"option_type_id":1,"option_value_id":4}]
```

### order_items Table:
```sql
order_item_id, order_id, product_id,
variant_id INT,                    -- OLD system
selected_options JSON              -- NEW system (already used!)
```

### Current Data Shows:
- cart_items records use `selected_options` JSON (variant_id is NULL)
- This proves the options system is ALREADY being used!

---

## Issue 5: Subcategory Hierarchy Limitation

### Current Structure:
```
categories (parent)
└── subcategories (child) - ONLY ONE LEVEL
```

### Needed Structure:
```
categories
└── subcategories
    └── sub-subcategories (nested levels)

Example:
Watches (category)
├── Men's Watches (subcategory)
│   ├── Original (sub-subcategory)
│   └── Non-Original (sub-subcategory)
└── Women's Watches (subcategory)
    ├── Original (sub-subcategory)
    └── Non-Original (sub-subcategory)
```

---

# TABLES TO DEPRECATE

| Table | Records | Backend Files | Why Remove |
|-------|---------|---------------|------------|
| `product_colors` | 8 | color.model.js, color.routes.js, color.controller.js, color.service.js | Merge to option_values |
| `product_sizes` | 4 | size.model.js, size.routes.js, size.controller.js, size.service.js | Merge to option_values |
| `product_variants` | 19 | variant.model.js, variant.routes.js, variant.controller.js, variant.service.js | Replace with option combinations |

### Code to Remove (After Migration):
- `backend/models/variant.model.js` (980 lines)
- `backend/models/color.model.js` (650 lines)
- `backend/models/size.model.js` (665 lines)
- `backend/routes/variant.routes.js`
- `backend/routes/color.routes.js`
- `backend/routes/size.routes.js`
- `backend/controllers/variant.controller.js`
- `backend/controllers/color.controller.js`
- `backend/controllers/size.controller.js`
- `backend/services/variant.service.js`
- `backend/services/color.service.js`
- `backend/services/size.service.js`

**Total: ~2,300+ lines of redundant code**

---

# NEW DATABASE SCHEMA

## New Table: product_option_combinations

Purpose: Track stock, SKU, and pricing for each unique combination of options.

```sql
CREATE TABLE product_option_combinations (
  combination_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  option_values_hash VARCHAR(64) NOT NULL,      -- MD5 hash of sorted option_value_ids
  option_values_json JSON NOT NULL,             -- [{"type_id":1,"value_id":5},...]
  sku VARCHAR(100) UNIQUE,
  additional_price DECIMAL(10,2) DEFAULT 0.00,
  stock_quantity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_product_options (product_id, option_values_hash),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);
```

## Modified Table: subcategories

Add self-referencing for nested hierarchy:

```sql
ALTER TABLE subcategories
ADD COLUMN parent_id INT NULL AFTER category_id,
ADD FOREIGN KEY (parent_id) REFERENCES subcategories(subcategory_id);
```

## Modified Table: product_option_values

Add hex_code for colors:

```sql
ALTER TABLE product_option_values
ADD COLUMN hex_code VARCHAR(7) NULL AFTER value_name_he,
ADD COLUMN image_url VARCHAR(500) NULL AFTER hex_code;
```

---

# IMPLEMENTATION PHASES

## PHASE 1: Database Foundation ✅ COMPLETED
**Status: COMPLETED (December 28, 2025)**

### Tasks Completed:
1. ✅ Create REMEMBER.md documentation
2. ✅ Add `parent_id` to subcategories table (migration created)
3. ✅ Add `hex_code`, `image_url`, `color_code` to product_option_values (migration created)
4. ✅ Create `product_option_combinations` table (migration created)
5. ✅ Create migration SQL script
6. ✅ Update subcategory model for nested queries
7. ✅ Update productOption model with hex_code, display_type support
8. ✅ Create productOptionCombination model, service, controller, routes

### Files Created/Modified:
- `backend/migrations/20251228_001_phase1_options_refactor.sql` (NEW)
- `backend/models/subcategory.model.js` (MODIFIED - added 15+ nested methods)
- `backend/models/productOption.model.js` (MODIFIED - added filter/color methods)
- `backend/models/productOptionCombination.model.js` (NEW - 400+ lines)
- `backend/services/productOptionCombination.service.js` (NEW)
- `backend/controllers/productOptionCombination.controller.js` (NEW)
- `backend/routes/productOptionCombination.routes.js` (NEW)
- `backend/routes/index.js` (MODIFIED - added new routes)

### New API Endpoints:
```
GET    /api/option-combinations/statistics
GET    /api/option-combinations/low-stock
GET    /api/option-combinations/out-of-stock
GET    /api/option-combinations/:id
PUT    /api/option-combinations/:id
DELETE /api/option-combinations/:id
PATCH  /api/option-combinations/:id/stock
POST   /api/option-combinations/bulk-stock
GET    /api/option-combinations/product/:productId
POST   /api/option-combinations/product/:productId/generate
POST   /api/option-combinations/product/:productId/find
POST   /api/option-combinations/product/:productId/price
DELETE /api/option-combinations/product/:productId
POST   /api/option-combinations
```

### Next Step:
Run the migration in phpMyAdmin:
1. Open phpMyAdmin
2. Select `vinashop` database
3. Go to SQL tab
4. Import: `backend/migrations/20251228_001_phase1_options_refactor.sql`
5. Execute

---

## PHASE 2: Data Migration ✅ COMPLETED
**Status: COMPLETED (December 28, 2025)**

### Tasks Completed:
1. ✅ Created SQL commands file for manual execution (NEEDED_SQL_COMMANDS.sql)
2. ✅ Created migration script (20251228_002_phase2_data_migration.sql)
3. ✅ Created dataMigration service for programmatic migration
4. ✅ Created dataMigration controller and routes
5. ✅ Updated PublicModel with options-based filters
6. ✅ Updated PublicController with new filter endpoints
7. ✅ Added new filter routes for dynamic options

### Files Created/Modified:
- `NEEDED_SQL_COMMANDS.sql` (NEW - manual SQL file)
- `backend/migrations/20251228_002_phase2_data_migration.sql` (NEW)
- `backend/services/dataMigration.service.js` (NEW)
- `backend/controllers/dataMigration.controller.js` (NEW)
- `backend/routes/dataMigration.routes.js` (NEW)
- `backend/models/public.model.js` (MODIFIED - new getOptionFilters)
- `backend/services/public.service.js` (MODIFIED)
- `backend/controllers/public.controller.js` (MODIFIED)
- `backend/routes/public.routes.js` (MODIFIED - new endpoints)
- `backend/routes/index.js` (MODIFIED - added migration routes)

### New API Endpoints:
```
GET    /api/migration/status               - Get migration status
POST   /api/migration/run                  - Run full migration
POST   /api/migration/rollback             - Rollback migration
POST   /api/migration/colors               - Migrate colors only
POST   /api/migration/sizes                - Migrate sizes only
POST   /api/migration/variants             - Migrate variants only

GET    /api/public/filters/options         - Get all option types
GET    /api/public/filters/options/:catId  - Get options for category
```

### How to Run Migration:

**Option 1: Manual SQL (phpMyAdmin)**
1. Run Phase 1 first: `backend/migrations/20251228_001_phase1_options_refactor.sql`
2. Run Phase 2: `NEEDED_SQL_COMMANDS.sql` OR `backend/migrations/20251228_002_phase2_data_migration.sql`

**Option 2: API (requires super_admin)**
```bash
# Check status
curl http://localhost:5000/api/migration/status

# Run full migration
curl -X POST http://localhost:5000/api/migration/run -H "Authorization: Bearer YOUR_TOKEN"
```

### Data Mapping Created:
```
_migration_color_mapping: old_color_id → new_option_value_id
_migration_size_mapping: old_size_id → new_option_value_id
_migration_variant_mapping: old_variant_id → new_combination_id
```

---

## PHASE 3: Backend Refactoring ✅ COMPLETED
**Status: COMPLETED (December 28, 2025)**

### Tasks Completed:
1. ✅ Enhance `productOption.model.js`:
   - Added combination management functions
   - Added stock management functions
   - Added SKU generation
2. ✅ Created `productOptionCombination.model.js` (in Phase 1)
3. ✅ Updated `productOption.service.js`
4. ✅ Updated `productOption.controller.js`
5. ✅ Updated `productOption.routes.js`
6. ✅ Updated `product.model.js` to use combinations:
   - Support both old (color_id/size_id) and new (option_values) filtering
   - Updated getWithDetails() to return both combinations and legacy variants
7. ✅ Updated `cart.model.js` to use combinations:
   - Added `combination_id`, `selected_options` support
   - Updated getByUserId() with combination joins
   - Updated getItem(), addItem(), updateItem() for combinations
   - Updated validateCart() for combination stock checking
   - Updated reserveStock(), releaseStock() for combinations
   - Added new methods: getItemByCombination(), addItemWithCombination(), updateItemToCombination()
8. ✅ Updated `order.model.js` to use combinations:
   - Updated getWithItems() and getItems() with combination joins
   - Updated addItem() to accept combination_id and selected_options
   - Added addItemWithCombination() method
9. ✅ Updated filter endpoints to use option_types (in Phase 2)
10. ✅ Marked variant/color/size routes as deprecated:
    - Added deprecation headers (X-Deprecated, X-Deprecated-Message)
    - Added JSDoc @deprecated tags with migration guide

### Files Modified in Phase 3:
- `backend/models/product.model.js` - Added combination support with backward compatibility
- `backend/models/cart.model.js` - Full combination support (60+ lines added)
- `backend/models/order.model.js` - Combination support for order items
- `backend/routes/variant.routes.js` - Marked as @deprecated with migration guide
- `backend/routes/color.routes.js` - Marked as @deprecated with migration guide
- `backend/routes/size.routes.js` - Marked as @deprecated with migration guide

### Backward Compatibility:
All models now support BOTH old and new systems:
- Cart/Order can use `variant_id` OR `combination_id`
- Filters work with both `color_id/size_id` AND `option_values`
- Stock management works for both variants and combinations
- Deprecated routes still work but return X-Deprecated headers

### New API Endpoints (from Phase 1):
```
POST   /api/option-combinations
GET    /api/option-combinations/:id
PUT    /api/option-combinations/:id
DELETE /api/option-combinations/:id
PATCH  /api/option-combinations/:id/stock
GET    /api/option-combinations/product/:productId
POST   /api/option-combinations/product/:productId/generate
```

---

## PHASE 4: Admin Dashboard Updates ✅ COMPLETED
**Status: COMPLETED (December 28, 2025)**

### Tasks Completed:
1. ✅ Added toggle between new (combinations) and legacy (variants) system in `Products.jsx`
2. ✅ Created `OptionCombinationsManager.jsx` component:
   - Select option types for a product
   - Select specific values within each type
   - Generate all possible combinations
   - Set stock, price, and SKU per combination
   - Bulk stock updates (reset, +10)
   - Save/delete combinations via API
3. ✅ Updated `api.js` with new API methods:
   - `optionCombinationsAPI` - full CRUD for combinations
   - `dataMigrationAPI` - migration endpoints
   - Extended `productOptionsAPI` with product options
   - Extended `subcategoriesAPI` with nested hierarchy methods
4. ✅ Updated product form to use `OptionCombinationsManager`
5. ✅ Added deprecation markers to `colorsAPI` and `sizesAPI`
6. ✅ Added translation keys for new features (EN, AR)

### Files Created/Modified:
- `frontend/src/components/OptionCombinationsManager.jsx` (NEW - 500+ lines)
- `frontend/src/services/api.js` (MODIFIED - added 50+ lines)
- `frontend/src/pages/Products/Products.jsx` (MODIFIED - integrated new component)
- `frontend/src/locales/en.json` (MODIFIED - new keys)
- `frontend/src/locales/ar.json` (MODIFIED - new keys)

### New Frontend Features:
- Toggle to switch between new and legacy variant systems
- OptionCombinationsManager with:
  - Multi-select option types
  - Checkbox selection for option values
  - Auto-generate combinations button
  - Inline editing of SKU, price, stock
  - Active/Inactive toggle per combination
  - Bulk stock management
  - Visual feedback for low/out-of-stock items

### Remaining Items (Optional):
- [ ] Update `Categories.jsx` for nested subcategories (tree view)
- [ ] Add drag-and-drop reordering for categories
- [ ] Create `CategoryTreeView.jsx` component
- [ ] Add dynamic filters component

---

## PHASE 5: Client Website Updates ✅ COMPLETED
**Status: COMPLETED (December 28, 2025)**

### Tasks Completed:
1. ✅ Updated `frontend-client/src/services/api.js`:
   - Added `subcategoryApi` with nested hierarchy support (getByCategory, getById, getTree, getParentChain)
   - Enhanced `categoryApi` with getProducts method
   - Enhanced `productApi.getAll()` with dynamic options support
   - Enhanced `filterApi` with getOptionTypes(), getOptionTypesByCategory()
   - Added `combinationApi` for product option combinations (getByProduct, findByOptions, calculatePrice, checkStock)
2. ✅ Updated `ProductsPage.jsx`:
   - Replaced hardcoded colors/sizes filters with dynamic `optionTypes` state
   - Fetch option types from `filterApi.getOptionTypes()` (respects category context)
   - Dynamic filter rendering based on option type (color swatch vs button display)
   - URL-based option filtering with `option_${typeId}=valueId` format
   - Updated `hasActiveFilters` to include dynamic options
3. ✅ Updated `ProductDetailPage.jsx`:
   - Added `combinationApi` import for option combination lookup
   - Added `currentCombination` and `combinationLoading` state
   - Created `lookupCombination()` to find matching combination when options change
   - Created `getEffectiveStock()` to use combination stock when available
   - Updated `calculateTotalPrice()` and `getUnitPrice()` to use combination price
   - Updated `handleAddToCart()` to include `combination_id` in cart item
   - Updated stock display, quantity controls, and add-to-cart button to use effective stock
   - Added combination SKU display and loading indicator
4. ✅ Updated `CartContext.jsx`:
   - Added `combinationId` support in cart items
   - Updated item matching logic to prioritize `combination_id` for new system
   - Maintains backward compatibility with legacy `variant_id` system
   - Updated item structure to include both old and new option systems
5. [ ] Create `CategoryPage.jsx` (optional enhancement)
6. [ ] Update `CheckoutPage.jsx` for options display (optional enhancement)

### Files Created/Modified:
- `frontend-client/src/services/api.js` (MODIFIED - added 100+ lines)
- `frontend-client/src/pages/Products/ProductsPage.jsx` (MODIFIED - dynamic filters)
- `frontend-client/src/pages/Products/ProductDetailPage.jsx` (MODIFIED - combination support)
- `frontend-client/src/context/CartContext.jsx` (MODIFIED - combination_id support)

### New Client API Methods:
```javascript
// Subcategory API
subcategoryApi.getByCategory(categoryId, lang)
subcategoryApi.getById(id, lang)
subcategoryApi.getTree(categoryId, lang)
subcategoryApi.getParentChain(id, lang)

// Filter API
filterApi.getOptionTypes(lang, categoryId)
filterApi.getOptionTypesByCategory(categoryId, lang)

// Combination API
combinationApi.getByProduct(productId)
combinationApi.findByOptions(productId, optionValues)
combinationApi.calculatePrice(productId, optionValues)
combinationApi.checkStock(productId, optionValues)
```

### URL Filter Format:
```
/products?category=1&option_5=20&option_3=9
         ↑ category  ↑ Color=Black  ↑ Size=30ml
```

---

## PHASE 6: Cleanup & Finalization ✅ COMPLETED
**Status: COMPLETED (December 28, 2025)**

### Tasks Completed:
1. ✅ Created backup SQL script for old tables
   - File: `backend/migrations/20251228_003_phase6_backup_deprecated.sql`
   - Creates `_backup_*` tables for product_colors, product_sizes, product_variants
2. ✅ Created drop migration script
   - File: `backend/migrations/20251228_004_phase6_drop_deprecated.sql`
   - Safely removes deprecated tables after backup verification
3. ✅ Moved deprecated backend files to `_deprecated` folder:
   - `backend/_deprecated/models/` - variant.model.js, color.model.js, size.model.js
   - `backend/_deprecated/controllers/` - variant.controller.js, color.controller.js, size.controller.js
   - `backend/_deprecated/services/` - variant.service.js, color.service.js, size.service.js
   - `backend/_deprecated/routes/` - variant.routes.js, color.routes.js, size.routes.js
   - `backend/_deprecated/README.md` - Documentation for deprecated files
4. ✅ Updated `routes/index.js`:
   - Removed imports for variant, color, size routes
   - Removed route mounts for /variants, /colors, /sizes
   - Added deprecation comments
   - Updated API info endpoint
5. ✅ Updated `CLAUDE.md`:
   - Updated database table documentation
   - Added deprecated tables section
   - Updated API modules list
   - Added Product Options Refactoring summary
6. [ ] Full system testing (recommended before production)
7. [ ] Performance testing (recommended before production)

### Files Created:
- `backend/migrations/20251228_003_phase6_backup_deprecated.sql` (NEW)
- `backend/migrations/20251228_004_phase6_drop_deprecated.sql` (NEW)
- `backend/_deprecated/README.md` (NEW)

### Files Moved (to _deprecated):
- 12 files total (models, controllers, services, routes for variant/color/size)

### To Complete Database Cleanup:
Run these migrations in phpMyAdmin **IN ORDER**:
1. First: `20251228_003_phase6_backup_deprecated.sql` (creates backups)
2. Then: `20251228_004_phase6_drop_deprecated.sql` (drops tables)

### To Permanently Delete Deprecated Code:
```bash
rm -rf backend/_deprecated
```

---

# PROGRESS TRACKING

| Phase | Description | Status | Started | Completed |
|-------|-------------|--------|---------|-----------|
| 1 | Database Foundation | ✅ COMPLETED | Dec 28, 2025 | Dec 28, 2025 |
| 2 | Data Migration | ✅ COMPLETED | Dec 28, 2025 | Dec 28, 2025 |
| 3 | Backend Refactoring | ✅ COMPLETED | Dec 28, 2025 | Dec 28, 2025 |
| 4 | Admin Dashboard | ✅ COMPLETED | Dec 28, 2025 | Dec 28, 2025 |
| 5 | Client Website | ✅ COMPLETED | Dec 28, 2025 | Dec 28, 2025 |
| 6 | Cleanup | ✅ COMPLETED | Dec 28, 2025 | Dec 28, 2025 |

## 🎉 ALL PHASES COMPLETE!

---

# NOTES & DECISIONS

1. **Keep variant_id columns temporarily**: Don't remove variant_id from cart_items/order_items until all data is migrated
2. **Use hash for combinations**: MD5 hash of sorted option_value_ids ensures uniqueness
3. **Backward compatibility**: Old orders with variant_id will still work (read-only)
4. **SKU format**: `{PRODUCT_SKU}-{OPTION_CODES}` (e.g., `VYRO-001-BLK-M`)

---

# HOW TO CONTINUE

## To Resume This Project:
1. Read this file (REMEMBER.md) to understand the current state
2. Check which phase is next (currently Phase 5: Client Website)
3. Review the tasks for that phase
4. Continue implementation

## Quick Commands:
```bash
# Start backend server
cd backend && npm run dev

# Run migrations in order (in phpMyAdmin or MySQL)
# 1. backend/migrations/20251228_001_phase1_options_refactor.sql
# 2. backend/migrations/20251228_002_phase2_data_migration.sql
# OR run NEEDED_SQL_COMMANDS.sql for manual execution

# Test new endpoints
curl http://localhost:5000/api/option-combinations/statistics
curl http://localhost:5000/api/public/filters/options
curl http://localhost:5000/api/migration/status
```

## Database Changes Required:
Before using the new system, ensure you have run the migrations:
1. Add `combination_id` column to `cart_items` table
2. Add `combination_id` column to `order_items` table
3. Create `product_option_combinations` table
4. Add `parent_id`, `level` to `subcategories` table
5. Add `hex_code`, `image_url`, `color_code` to `product_option_values` table

---

*Last Updated: December 28, 2025*
*Status: ALL PHASES COMPLETE*
*Phase 1 Completed: December 28, 2025*
*Phase 2 Completed: December 28, 2025*
*Phase 3 Completed: December 28, 2025*
*Phase 4 Completed: December 28, 2025*
*Phase 5 Completed: December 28, 2025*
*Phase 6 Completed: December 28, 2025*

---

## FINAL STEPS (Manual)

To complete the database cleanup, run these SQL files in phpMyAdmin:

1. **Backup deprecated tables:**
   ```
   backend/migrations/20251228_003_phase6_backup_deprecated.sql
   ```

2. **Drop deprecated tables:**
   ```
   backend/migrations/20251228_004_phase6_drop_deprecated.sql
   ```

3. **Optionally delete deprecated code:**
   ```bash
   rm -rf backend/_deprecated
   ```
