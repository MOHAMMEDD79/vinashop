// VinaShop Client Constants

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://api.vinashop.ps/api';
export const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || 'http://api.vinashop.ps';

// Delivery Areas and Fees (in ILS)
export const DELIVERY_AREAS = {
  ISRAEL_48: {
    id: 'israel_48',
    nameEn: '48 Areas',
    nameAr: 'الداخل 48',
    fee: 70
  },
  ABU_GHOSH: {
    id: 'abu_ghosh',
    nameEn: 'Abu Ghosh',
    nameAr: 'ابو غوش',
    fee: 45
  },
  JERUSALEM: {
    id: 'jerusalem',
    nameEn: 'Jerusalem',
    nameAr: 'القدس',
    fee: 30
  },
  WEST_BANK: {
    id: 'west_bank',
    nameEn: 'West Bank',
    nameAr: 'الضفة الغربية',
    fee: 20
  }
};

// Currency
export const CURRENCY = {
  code: 'ILS',
  symbol: '₪',
  nameEn: 'Israeli Shekel',
  nameAr: 'شيكل'
};

// Phone Validation Patterns (Palestinian/Israeli)
export const PHONE_PATTERNS = {
  // Palestinian mobile: 059xxxxxxx, 056xxxxxxx
  PALESTINIAN_MOBILE: /^(059|056)\d{7}$/,
  // Israeli mobile: 05xxxxxxxx
  ISRAELI_MOBILE: /^05\d{8}$/,
  // Landline: 02, 03, 04, 08, 09 area codes
  LANDLINE: /^0[2-489]\d{7}$/,
  // Combined pattern
  ALL: /^(05[0-9]\d{7}|0[2-489]\d{7})$/
};

// Validate phone number
export const validatePhone = (phone) => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return PHONE_PATTERNS.ALL.test(cleaned);
};

// Format price
export const formatPrice = (price) => {
  return `${CURRENCY.symbol}${parseFloat(price).toFixed(2)}`;
};

// Placeholder image path
export const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

// Get image URL
export const getImageUrl = (path) => {
  if (!path) return PLACEHOLDER_IMAGE;
  if (path.startsWith('http')) return path;
  // If path already includes 'uploads/', don't add it again
  if (path.startsWith('uploads/')) {
    return `${UPLOADS_URL}/${path}`;
  }
  return `${UPLOADS_URL}/uploads/${path}`;
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  LIMITS: [12, 24, 48]
};

// Sort options
export const SORT_OPTIONS = [
  { value: 'newest', labelEn: 'Newest', labelAr: 'الأحدث' },
  { value: 'price_asc', labelEn: 'Price: Low to High', labelAr: 'السعر: من الأقل للأعلى' },
  { value: 'price_desc', labelEn: 'Price: High to Low', labelAr: 'السعر: من الأعلى للأقل' },
  { value: 'name_asc', labelEn: 'Name: A-Z', labelAr: 'الاسم: أ-ي' },
  { value: 'name_desc', labelEn: 'Name: Z-A', labelAr: 'الاسم: ي-أ' }
];
