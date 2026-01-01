# ToteSmokeAdminV2 Changes Log

## Session: December 22, 2025

### Issues Fixed

#### 1. Image URL Fallback Port Fixed
**File Modified:** `frontend/src/utils/imageUrl.js`
- Fixed fallback URL from port 5000 to port 3000
- Images are stored in ToteSmokeApp on port 3000, not the admin backend
- This ensures images display correctly even without `.env` file

```javascript
// Before (incorrect):
const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:5000';

// After (correct):
const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:3000';
```

#### 2. Added Admin Setup Endpoints
**File Modified:** `backend/routes/test.routes.js`

Added public endpoints for initial admin setup:
- `GET /api/admin/v1/test/check-admin` - Check if any admin exists
- `POST /api/admin/v1/test/setup-admin` - Create initial super_admin (only works if no admin exists)

Default admin credentials created:
- Email: admin@totesmoke.com
- Password: Admin@123
- Role: super_admin

#### 3. Clarified TOKEN_REQUIRED Error
The error `{"success":false,"message":"Access token is required","error_code":"TOKEN_REQUIRED"}` is **expected behavior**, not a bug.

Protected endpoints like `/api/admin/v1/test/categories` require authentication.
To fix:
1. Login via frontend to get a token
2. Token is stored in localStorage
3. All subsequent API requests include the token

Public test endpoints (no auth required):
- `GET /api/admin/v1/test/ping` - Basic connectivity test
- `GET /api/admin/v1/test/db` - Database connection test
- `GET /api/admin/v1/test/tables` - List database tables
- `GET /api/admin/v1/test/check-admin` - Check if admin exists

### How to Start Servers

Both servers must be running for the admin dashboard to work:

```powershell
# Terminal 1 - ToteSmokeApp (Images server)
cd C:\Users\Administrator\Desktop\ToteSmokeApp\backend
node server.js
# Runs on http://localhost:3000

# Terminal 2 - ToteSmokeAdminV2 (Admin API)
cd C:\Users\Administrator\Desktop\ToteSmokeAdminV2\backend
node server.js
# Runs on http://localhost:5000
```

### Server Health Checks
```bash
# ToteSmokeApp health check
curl http://localhost:3000/api/health

# ToteSmokeAdminV2 health check
curl http://localhost:5000/health

# Database connection test
curl http://localhost:5000/api/admin/v1/test/db
```

### Second Update: Banner Fixes

#### 4. Fixed Banner Image Loading (BLOB Support)
**Issue:** Banner images weren't loading because banners use `media_data` (LONGBLOB) for storage, not file paths like products.

**Files Modified:**
- `backend/routes/test.routes.js`:
  - Added `GET /api/admin/v1/test/banners/:id/media` - Public endpoint to serve BLOB images
  - Updated banners list endpoint to include `media_url` field
  - Added `has_blob_media` flag to detect BLOB vs external URL

- `frontend/src/pages/Banners/Banners.jsx`:
  - Updated `getMediaUrl()` to handle both BLOB endpoints and external URLs
  - Fixed field names: `cat.name_en` instead of `cat.category_name_en`
  - Fixed field names: `prod.name_en` instead of `prod.product_name_en`
  - Fixed products data access: `res.data.data` instead of `res.data.data?.products`

#### 5. Fixed Categories/Products Dropdowns in Banners
**Issue:** When selecting "category" or "product" as link type, no options showed in dropdown.

**Root Cause:**
- Field name mismatch: API returns `name_en`, but frontend expected `category_name_en`
- Products endpoint returned `data` but frontend looked for `data.products`

**Fixes:**
- Fixed field names in Banners.jsx dropdowns
- Updated test routes to return all categories/products (not just 10)
- Fixed products data structure access

---

## Session: December 21, 2025

### Problem Solved: Images Not Displaying

**Root Cause:** Two separate apps (ToteSmokeApp on port 3000, ToteSmokeAdminV2 on port 5000) share the same database. Images are stored in ToteSmokeApp's uploads folder, but the admin dashboard was trying to load them from the wrong server.

### Changes Made:

#### 1. Frontend Environment Configuration
**Files Created/Modified:**
- `frontend/.env` - Environment variables for API and uploads URLs
- `frontend/.env.example` - Example configuration for deployment

```env
VITE_API_URL=http://localhost:5000      # Admin API (ToteSmokeAdminV2)
VITE_UPLOADS_URL=http://localhost:3000  # Image server (ToteSmokeApp)
```

#### 2. Centralized Image URL Utility
**File Created:** `frontend/src/utils/imageUrl.js`
- Converts relative database paths to full URLs
- Uses VITE_UPLOADS_URL environment variable
- Handles edge cases (full URLs, base64, null paths)

#### 3. Updated Components to Use Image Utility
- `frontend/src/pages/Products/Products.jsx` - Added `import { getImageUrl } from '../../utils/imageUrl'`
- `frontend/src/pages/Categories/Categories.jsx` - Added `import { getImageUrl } from '../../utils/imageUrl'`
- `frontend/src/pages/Banners/Banners.jsx` - Added `import { getImageUrl } from '../../utils/imageUrl'`
- `frontend/src/pages/BillImages/BillImages.jsx` - Added `import { getImageUrl } from '../../utils/imageUrl'`

#### 4. Updated API Service
**File Modified:** `frontend/src/services/api.js`
- Now uses `VITE_API_URL` environment variable

#### 5. Fixed CORS/Helmet in ToteSmokeApp (for cross-origin image loading)
**File Modified:** `C:\Users\Administrator\Desktop\ToteSmokeApp\backend\server.js`

```javascript
// Configure helmet with relaxed settings for cross-origin resource sharing
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));

// Serve uploads with CORS headers for admin dashboard access
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static('uploads'));
```

### Previous Changes (from earlier session):

#### Product Options Feature
- Removed subcategory field from product add/edit form
- Added product options selector with checkboxes
- Backend routes updated to handle `option_values`

#### Banner Upload Fix
- Added video MIME types to multer config
- Created `bannerMediaUpload` configuration
- Fixed upload path from `uploads/products/` to `uploads/banners/`

---

## Production Deployment Notes

When deploying to production, update `.env`:
```env
VITE_API_URL=https://admin-api.yourdomain.com
VITE_UPLOADS_URL=https://api.yourdomain.com
```

Both servers must be running:
- ToteSmokeApp (port 3000) - Serves images from /uploads
- ToteSmokeAdminV2 (port 5000) - Admin API
