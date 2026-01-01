import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { FiChevronRight, FiChevronLeft, FiGrid, FiList, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { categoryApi, productApi } from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';
import { SORT_OPTIONS, PAGINATION, getImageUrl } from '../../utils/constants';
import './CategoryPage.css';

const CategoryPage = () => {
  const { id } = useParams();
  const { t, getLocalized, isRTL, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT,
    totalPages: 0
  });

  // Filters from URL
  const filters = {
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1
  };

  const ArrowIcon = isRTL ? FiChevronLeft : FiChevronRight;

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      try {
        const response = await categoryApi.getById(id, language);
        setCategory(response.category || response);
      } catch (error) {
        console.error('Error fetching category:', error);
        setCategory(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCategory();
    }
  }, [id, language]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!id) return;

      setProductsLoading(true);
      try {
        const response = await categoryApi.getProducts(id, {
          ...filters,
          limit: PAGINATION.DEFAULT_LIMIT,
          lang: language
        });

        setProducts(response.products || []);
        setPagination({
          total: response.pagination?.total || 0,
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || PAGINATION.DEFAULT_LIMIT,
          totalPages: response.pagination?.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [id, searchParams, language]);

  // Update URL params
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  if (loading) {
    return <Loading />;
  }

  if (!category) {
    return (
      <div className="category-page">
        <div className="container">
          <div className="not-found">
            <h2>{isRTL ? 'التصنيف غير موجود' : 'Category Not Found'}</h2>
            <p>{isRTL ? 'عذرا، لم نتمكن من العثور على هذا التصنيف' : 'Sorry, we could not find this category'}</p>
            <Link to="/products" className="btn btn-primary">
              {isRTL ? 'تصفح المنتجات' : 'Browse Products'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subcategories = category.subcategories || [];
  const hasSubcategories = subcategories.length > 0;

  return (
    <div className="category-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-wrapper">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">{t('nav.home') || (isRTL ? 'الرئيسية' : 'Home')}</Link>
            <ArrowIcon className="breadcrumb-separator" />
            <Link to="/categories">{isRTL ? 'التصنيفات' : 'Categories'}</Link>
            <ArrowIcon className="breadcrumb-separator" />
            <span className="current">{getLocalized(category, 'name')}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <section className="category-header">
        <div className="container">
          {category.image_url && (
            <div className="category-banner">
              <img
                src={getImageUrl(category.image_url)}
                alt={getLocalized(category, 'name')}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="category-banner-overlay" />
            </div>
          )}
          <div className="category-info">
            <h1 className="category-title">{getLocalized(category, 'name')}</h1>
            {category.description && (
              <p className="category-description">{category.description}</p>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        {/* Subcategories Section */}
        {hasSubcategories && (
          <section className="subcategories-section">
            <h2 className="section-title">
              {isRTL ? 'الأقسام الفرعية' : 'Subcategories'}
            </h2>
            <div className="subcategories-grid">
              {subcategories.map((sub) => (
                <Link
                  key={sub.subcategory_id}
                  to={`/subcategory/${sub.subcategory_id}`}
                  className="subcategory-card"
                >
                  <div className="subcategory-image">
                    {sub.image_url ? (
                      <img
                        src={getImageUrl(sub.image_url)}
                        alt={getLocalized(sub, 'name')}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="subcategory-placeholder">
                        <span>{getLocalized(sub, 'name')?.charAt(0) || '?'}</span>
                      </div>
                    )}
                  </div>
                  <div className="subcategory-info">
                    <h3 className="subcategory-name">{getLocalized(sub, 'name')}</h3>
                    <div className="subcategory-meta">
                      {sub.children_count > 0 && (
                        <span className="subcategory-count">
                          {sub.children_count} {isRTL ? 'قسم فرعي' : 'subcategories'}
                        </span>
                      )}
                      {sub.product_count > 0 && (
                        <span className="subcategory-count">
                          {sub.product_count} {isRTL ? 'منتج' : 'products'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowIcon className="subcategory-arrow" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Products Section */}
        <section className="products-section">
          <div className="products-header">
            <h2 className="section-title">
              {isRTL ? 'المنتجات' : 'Products'}
              {pagination.total > 0 && (
                <span className="products-count">({pagination.total})</span>
              )}
            </h2>
            <div className="products-controls">
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <FiGrid />
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <FiList />
                </button>
              </div>

              <div className="sort-control">
                <label>{isRTL ? 'ترتيب:' : 'Sort:'}</label>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="sort-select"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {language === 'ar' ? option.labelAr : option.labelEn}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-arrow" />
              </div>
            </div>
          </div>

          {productsLoading ? (
            <Loading />
          ) : products.length === 0 ? (
            <div className="no-products">
              <p>{isRTL ? 'لا توجد منتجات في هذا التصنيف' : 'No products in this category'}</p>
              {hasSubcategories && (
                <span>{isRTL ? 'تصفح الأقسام الفرعية أعلاه' : 'Browse the subcategories above'}</span>
              )}
            </div>
          ) : (
            <>
              <div className={`products-grid ${viewMode}`}>
                {products.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`pagination-btn ${pagination.page === page ? 'active' : ''}`}
                      onClick={() => updateFilter('page', page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default CategoryPage;
