import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiChevronLeft, FiGrid, FiPackage, FiSearch } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { categoryApi } from '../../services/api';
import Loading from '../../components/common/Loading';
import { getImageUrl } from '../../utils/constants';
import './CategoriesPage.css';

const CategoriesPage = () => {
  const { t, getLocalized, isRTL, language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const ArrowIcon = isRTL ? FiChevronLeft : FiChevronRight;

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await categoryApi.getAll(language);
        const data = response.data || response.categories || response;
        const categoriesArray = Array.isArray(data) ? data : [];
        setCategories(categoriesArray);
        setFilteredCategories(categoriesArray);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        setFilteredCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [language]);

  // Filter categories based on search query (searches both Arabic and English names)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = categories.filter(category => {
      // Search in English name
      const nameEn = (category.category_name_en || category.name_en || '').toLowerCase();
      // Search in Arabic name
      const nameAr = (category.category_name_ar || category.name_ar || '');
      // Search in description
      const descEn = (category.category_description_en || category.description_en || '').toLowerCase();
      const descAr = (category.category_description_ar || category.description_ar || '');

      return nameEn.includes(query) ||
             nameAr.includes(query) ||
             descEn.includes(query) ||
             descAr.includes(query);
    });

    setFilteredCategories(filtered);
  }, [searchQuery, categories]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="categories-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-wrapper">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">{t('nav.home') || (isRTL ? 'الرئيسية' : 'Home')}</Link>
            <ArrowIcon className="breadcrumb-separator" />
            <span className="current">{isRTL ? 'الأصناف' : 'Categories'}</span>
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <section className="categories-header">
        <div className="container">
          <div className="header-content">
            <FiGrid className="header-icon" />
            <h1 className="page-title">{isRTL ? 'تصفح جميع الأصناف' : 'Browse Categories'}</h1>
            <p className="page-description">
              {isRTL
                ? 'اكتشفي مجموعتنا الواسعة من المنتجات عبر الأصناف المختلفة'
                : 'Discover our wide collection of products across different categories'
              }
            </p>
          </div>

          {/* Category Search Bar */}
          <div className="category-search">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ابحثي عن صنف... (عربي أو إنجليزي)' : 'Search categories... (Arabic or English)'}
                className="search-input"
              />
            </div>
            {searchQuery && (
              <p className="search-results-count">
                {isRTL
                  ? `تم العثور على ${filteredCategories.length} صنف`
                  : `Found ${filteredCategories.length} ${filteredCategories.length === 1 ? 'category' : 'categories'}`
                }
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="categories-content">
        <div className="container">
          {filteredCategories.length === 0 ? (
            <div className="no-categories">
              <FiPackage size={60} />
              <h2>{isRTL ? 'لا توجد أصناف' : 'No Categories Found'}</h2>
              <p>
                {searchQuery
                  ? (isRTL ? `لم نتمكن من العثور على أصناف تطابق "${searchQuery}"` : `No categories match "${searchQuery}"`)
                  : (isRTL ? 'لم نتمكن من العثور على أي أصناف' : 'We could not find any categories')
                }
              </p>
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="btn btn-primary">
                  {isRTL ? 'مسح البحث' : 'Clear Search'}
                </button>
              ) : (
                <Link to="/products" className="btn btn-primary">
                  {isRTL ? 'تصفح جميع المنتجات' : 'Browse All Products'}
                </Link>
              )}
            </div>
          ) : (
            <div className="categories-grid">
              {filteredCategories.map((category) => {
                const name = getLocalized(category, 'name') || category.category_name_en;
                const description = category.description || category.category_description_en;
                const imageUrl = category.image_url || category.category_image;
                const productCount = category.product_count || 0;
                const subcategoryCount = category.subcategory_count || category.subcategories?.length || 0;

                return (
                  <Link
                    key={category.category_id}
                    to={`/category/${category.category_id}`}
                    className="category-card"
                  >
                    <div className="category-image">
                      {imageUrl ? (
                        <img
                          src={getImageUrl(imageUrl)}
                          alt={name}
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="category-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
                        <span>{name?.charAt(0) || '?'}</span>
                      </div>
                      <div className="category-overlay">
                        <span className="explore-text">
                          {isRTL ? 'استكشف' : 'Explore'}
                          <ArrowIcon />
                        </span>
                      </div>
                    </div>
                    <div className="category-content">
                      <h2 className="category-name">{name}</h2>
                      {description && (
                        <p className="category-description">{description}</p>
                      )}
                      <div className="category-meta">
                        {subcategoryCount > 0 && (
                          <span className="meta-item">
                            <FiGrid />
                            {subcategoryCount} {isRTL ? 'قسم فرعي' : 'subcategories'}
                          </span>
                        )}
                        {productCount > 0 && (
                          <span className="meta-item">
                            <FiPackage />
                            {productCount} {isRTL ? 'منتج' : 'products'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoriesPage;
