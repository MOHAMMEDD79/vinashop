# VinaShop - Project Documentation

## Project Overview
VinaShop Admin Dashboard - A comprehensive e-commerce admin panel for managing a Palestinian fashion/accessories e-commerce platform. The admin dashboard is complete; now building the client-facing website.

## Technology Stack
- **Frontend**: React.js (to be built - Phase 2)
- **Backend**: Node.js + Express.js (extended for admin)
- **Database**: MySQL/MariaDB (XAMPP + phpMyAdmin)
- **Authentication**: JWT (Access + Refresh tokens)
- **File Upload**: Multer + Sharp (image processing)
- **Email**: Nodemailer
- **Validation**: Joi

---

## PHASE 1 COMPLETION STATUS: COMPLETE

### What Was Done in Phase 1

#### 1. Database Migration Created
**File**: `backend/scripts/admin_dashboard_migration.sql`

New tables added:
| Table | Purpose |
|-------|---------|
| `invoices` | Customer invoices with status tracking |
| `invoice_items` | Individual invoice line items |
| `suppliers` | Supplier/vendor management |
| `supplier_bills` | Bills from suppliers |
| `supplier_bill_items` | Supplier bill line items |
| `payments` | Payment records for invoices/orders |
| `bill_images` | Uploaded bill images (separate system) |
| `order_status_history` | Order status change tracking |
| `admin_activity_log` | Admin action logging |
| `settings` | System settings storage |
| `transactions` | Financial ledger/transactions |
| `admin_traders` | Business partners/suppliers |

**To apply**: Import `admin_dashboard_migration.sql` in phpMyAdmin

#### 2. Product Options Management Added
**Files created**:
- `backend/models/productOption.model.js`
- `backend/services/productOption.service.js`
- `backend/controllers/productOption.controller.js`
- `backend/routes/productOption.routes.js`

**Endpoints**: `/api/product-options`
- `GET /types` - List all option types
- `GET /types/:id` - Get option type with values
- `POST /types` - Create option type
- `PUT /types/:id` - Update option type
- `DELETE /types/:id` - Delete option type
- `GET /types/:typeId/values` - Get values for type
- `POST /types/:typeId/values` - Create value
- `POST /types/:typeId/values/bulk` - Bulk create values
- `PUT /values/:id` - Update value
- `DELETE /values/:id` - Delete value
- `GET /products/:productId` - Get product options
- `PUT /products/:productId` - Set product options
- `POST /products/:productId` - Add option to product
- `DELETE /products/:productId/types/:typeId` - Remove option
- `GET /statistics` - Option statistics

#### 3. Bill Images System Added
**Files created**:
- `backend/models/billImage.model.js`
- `backend/services/billImage.service.js`
- `backend/controllers/billImage.controller.js`
- `backend/routes/billImage.routes.js`

**Endpoints**: `/api/bill-images`
- `GET /` - List all bill images
- `GET /:id` - Get bill image by ID
- `POST /` - Upload single bill image
- `POST /multiple` - Upload multiple images
- `PUT /:id` - Update bill image details
- `DELETE /:id` - Delete bill image
- `POST /bulk/delete` - Bulk delete images
- `PATCH /:id/processed` - Mark as processed
- `PATCH /:id/unprocessed` - Mark as unprocessed
- `GET /statistics` - Bill image statistics
- `GET /type/:type` - Get by bill type (purchase/expense/receipt/other)
- `GET /unprocessed` - Get unprocessed bills
- `GET /summary/:year/:month` - Monthly summary
- `GET /search` - Search bill images

#### 4. Routes Index Updated
**File modified**: `backend/routes/index.js`
- Added `productOptionRoutes`
- Added `billImageRoutes`

---

## Database Structure (vinashop)

### User Management
| Table | Purpose |
|-------|---------|
| `users` | Customer profiles (Google/Facebook OAuth, email verification) |
| `admin_users` | Admin accounts with roles (super_admin, admin, moderator) |
| `admins` | Alternative admin table with roles and status |
| `user_addresses` | Shipping addresses (west_bank, jerusalem, occupied_48 regions) |

### Products & Catalog
| Table | Purpose |
|-------|---------|
| `categories` | Product categories (multilingual: EN, AR, HE) |
| `subcategories` | Product subcategories with nested hierarchy (parent_id) |
| `products` | Main product table with pricing, ratings, stock |
| `product_images` | Product images (primary image support) |
| `product_attributes` | Additional product attributes (multilingual) |
| `product_options` | Product-option type links |
| `product_option_types` | Option type definitions (Color, Size, Material, etc.) |
| `product_option_values` | Option value definitions with hex_code for colors |
| `product_option_combinations` | **NEW** Stock/price per option combination |

### Deprecated Tables (Phase 6)
| Table | Status |
|-------|--------|
| `product_colors` | DEPRECATED - Merged into product_option_values |
| `product_sizes` | DEPRECATED - Merged into product_option_values |
| `product_variants` | DEPRECATED - Replaced by product_option_combinations |

### Orders & Commerce
| Table | Purpose |
|-------|---------|
| `orders` | Customer orders (pending, confirmed, processing, shipped, delivered, cancelled) |
| `order_items` | Individual items within orders with selected options |
| `cart_items` | Shopping cart items with options support |

### Billing (NEW - from migration)
| Table | Purpose |
|-------|---------|
| `invoices` | Customer invoices |
| `invoice_items` | Invoice line items |
| `suppliers` | Vendor management |
| `supplier_bills` | Supplier invoices |
| `supplier_bill_items` | Supplier bill items |
| `payments` | Payment records |
| `transactions` | Financial ledger |
| `bill_images` | Uploaded bill images |

### Other Tables
| Table | Purpose |
|-------|---------|
| `product_reviews` | Product reviews with 1-5 star ratings |
| `contact_messages` | Contact form messages with status |
| `notifications` | System notifications with type classification |
| `phone_otps` | Phone OTP verification records |
| `banners` | Marketing banners (multilingual, scheduling) |
| `wishlist` | User product wishlists |
| `admin_activity_log` | Admin action tracking |
| `order_status_history` | Order status changes |
| `settings` | System settings |

## Backend Structure

```
backend/
├── config/          # DB, JWT, Email, CORS, Multer configs
├── controllers/     # 20 controllers - business logic
│   ├── productOption.controller.js (NEW)
│   └── billImage.controller.js (NEW)
├── models/          # 21 models - database interaction
│   ├── productOption.model.js (NEW)
│   └── billImage.model.js (NEW)
├── routes/          # 21 route files - API endpoints
│   ├── productOption.routes.js (NEW)
│   └── billImage.routes.js (NEW)
├── services/        # 21 services - reusable business logic
│   ├── productOption.service.js (NEW)
│   └── billImage.service.js (NEW)
├── scripts/
│   └── admin_dashboard_migration.sql (NEW)
├── middleware/      # Auth, validation, upload, error handling
├── utils/           # Helpers, validators, logger, pagination
├── uploads/
│   └── bills/       # Bill images storage (NEW)
└── server.js        # Main entry point
```

## API Modules

| Module | Base Route | Purpose |
|--------|------------|---------|
| Auth | `/api/auth` | Login, logout, 2FA, sessions, password reset |
| Admins | `/api/admins` | Admin user management |
| Products | `/api/products` | Full product CRUD, images, bulk ops |
| Categories | `/api/categories` | Category management |
| Subcategories | `/api/subcategories` | Subcategory management (nested hierarchy) |
| Orders | `/api/orders` | Order processing, status, invoices |
| Users | `/api/users` | Customer management |
| Messages | `/api/messages` | Contact form handling |
| Reviews | `/api/reviews` | Review moderation |
| Images | `/api/images` | Image management |
| Notifications | `/api/notifications` | Push, email, in-app notifications |
| Dashboard | `/api/dashboard` | Analytics, stats |
| Reports | `/api/reports` | Sales, orders, products reports |
| Billing | `/api/billing` | Invoices, supplier bills, payments |
| Settings | `/api/settings` | Store, payment, shipping settings |
| **Product Options** | `/api/product-options` | Option types and values |
| **Option Combinations** | `/api/option-combinations` | Stock/price per combination |
| **Public** | `/api/public` | Public product catalog, filters |
| **Migration** | `/api/migration` | Data migration utilities |
| **Bill Images** | `/api/bill-images` | Bill image uploads |

### Deprecated Routes (Removed in Phase 6)
| Route | Replacement |
|-------|-------------|
| `/api/variants` | `/api/option-combinations` |
| `/api/colors` | `/api/product-options` (Color type) |
| `/api/sizes` | `/api/product-options` (Size type) |

## Admin Roles & Permissions

### Roles
- `super_admin` - Full access, can create other admins
- `admin` - Full module access
- `moderator` - Limited access

### Permission Actions
- `read` - View data
- `create` - Add new records
- `update` - Modify existing records
- `delete` - Remove records

## Environment Configuration

```env
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=vinashop
JWT_SECRET=vinashop-secret-key-2024-ultra-secure
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:5000
```

## Development Plan

### Phase 1: Backend Extensions - COMPLETE
- [x] Analyzed database structure
- [x] Reviewed existing controllers
- [x] Created database migration for missing tables
- [x] Added product options management endpoints
- [x] Created bill images system
- [x] Updated routes index

**Next Step**: Run migration in phpMyAdmin

### Phase 2: Frontend Development - PENDING
- React admin dashboard
- Component-based architecture
- API integration with existing backend

### Admin Dashboard Pages (Planned for Phase 2)
1. Dashboard (overview, stats)
2. Products (list, add, edit, options)
3. Categories (list, add, edit)
4. Orders (list, view, approve, status)
5. Users/Customers (list, view)
6. Billing (invoices, bills, image uploads)
7. Settings (for super admin)
8. Admin Users (for super admin)

---

## Phase 3: Workers Salary Management Enhancement

### New Features Added

#### 1. Database Migration System
**File**: `backend/config/migrations.js`

Automatic migration system that:
- Runs on server startup
- Tracks executed migrations in `migrations` table
- Supports creating new migrations with timestamps
- Provides checksum validation

**Migration Files**: `backend/migrations/`
- Migrations are executed in alphabetical order
- Each migration runs only once
- Failed migrations are rolled back

#### 2. Past Salaries Report
**New Endpoints**:
- `GET /api/admin/v1/workers/salaries/:year/:month` - Get all salaries for a specific period
- `GET /api/admin/v1/workers/unpaid/:year/:month` - Get unpaid workers for a period
- `GET /api/admin/v1/workers/past-salaries` - Get past salaries report

**Frontend Features**:
- New "Past Salaries" tab on Workers page
- Month/Year filter to view historical salary records
- Summary cards showing total paid, pending, and grand total
- Quick pay button for pending salaries
- "Workers Needing Salary" section showing:
  - Workers without salary generated
  - Workers with pending payment

#### 3. Unpaid Workers Alert
- Alert banner on Workers page when unpaid salaries exist
- Shows count of workers without salary generated
- Shows count of workers with pending payment
- Shows total pending amount
- Quick link to Past Salaries tab

### Files Modified

**Backend**:
- `backend/server.js` - Added migration runner on startup
- `backend/config/migrations.js` - NEW - Migration system
- `backend/migrations/20251225_001_add_salary_indexes.sql` - NEW - Initial migration
- `backend/models/worker.model.js` - Added new query methods
- `backend/services/worker.service.js` - Added new service methods
- `backend/controllers/worker.controller.js` - Added new controller methods
- `backend/routes/worker.routes.js` - Added new routes

**Frontend**:
- `frontend/src/pages/Workers/Workers.jsx` - Added Past Salaries tab and Unpaid Workers alert
- `frontend/src/services/api.js` - Added new API methods
- `frontend/src/locales/en.json` - Added translation keys
- `frontend/src/locales/ar.json` - Added Arabic translations
- `frontend/src/locales/he.json` - Added Hebrew translations

---

## How to Apply Changes

### Automatic (Recommended)
The migration system runs automatically when the server starts:
```bash
cd backend
npm run dev
```

Migrations are tracked in the `migrations` table and only run once.

### Manual (if needed)
1. **Run Database Migration**:
   - Open phpMyAdmin
   - Select `vinashop` database
   - Go to SQL tab
   - Import content from `backend/migrations/20251225_001_add_salary_indexes.sql`
   - Execute

2. **Test Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Test New Endpoints**:
   - Salaries by Period: `GET http://localhost:5000/api/admin/v1/workers/salaries/2025/12`
   - Unpaid Workers: `GET http://localhost:5000/api/admin/v1/workers/unpaid/2025/12`
   - Past Salaries Report: `GET http://localhost:5000/api/admin/v1/workers/past-salaries`

---

## Product Options Refactoring (December 28, 2025)

A complete refactoring of the product variant system was completed:

### Phases Completed:
1. **Phase 1: Database Foundation** - Created `product_option_combinations` table, added nested subcategory support
2. **Phase 2: Data Migration** - Created migration scripts to transfer data from old to new system
3. **Phase 3: Backend Refactoring** - Updated cart, order, product models for combination support
4. **Phase 4: Admin Dashboard** - Added `OptionCombinationsManager` component, toggle between systems
5. **Phase 5: Client Website** - Updated ProductsPage (dynamic filters), ProductDetailPage (combinations), CartContext
6. **Phase 6: Cleanup** - Removed deprecated variant/color/size files, updated routes

### Key Changes:
- **Old System**: Separate `product_colors`, `product_sizes`, `product_variants` tables
- **New System**: Unified `product_option_types`, `product_option_values`, `product_option_combinations` tables
- Supports unlimited option types (Color, Size, Material, Flavor, etc.)
- Combination-based stock and pricing
- Backward compatible with existing orders/cart

### Important Files:
- `backend/_deprecated/` - Old variant/color/size files (kept for reference)
- `backend/migrations/20251228_*.sql` - Migration scripts
- `REMEMBER.md` - Detailed refactoring documentation

---

*Last Updated: December 28, 2025*
*Status: Phase 6 Complete - Product options refactoring finished, deprecated files moved to _deprecated folder*
