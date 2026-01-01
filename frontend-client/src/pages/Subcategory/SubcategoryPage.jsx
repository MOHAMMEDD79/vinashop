import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiChevronRight, FiChevronLeft, FiGrid, FiList, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { subcategoryApi } from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';
import { SORT_OPTIONS, PAGINATION, getImageUrl } from '../../utils/constants';
import './SubcategoryPage.css';

const SubcategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, getLocalized, isRTL, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [subcategory, setSubcategory] = useState(null);
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

  // Fetch subcategory data
  useEffect(() => {
    const fetchSubcategory = async () => {
      setLoading(true);
      try {
        const response = await subcategoryApi.getById(id, language);
        setSubcategory(response.subcategory || response);
      } catch (error) {
        console.error('Error fetching subcategory:', error);
        setSubcategory(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSubcategory();
    }
  }, [id, language]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!id) return;

      setProductsLoading(true);
      try {
        const response = await subcategoryApi.getProducts(id, {
          ...filters,
          limit: PAGINATION.DEFAULT_LIMIT,
          lang: language,
          includeChildren: true
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

  // Handle child subcategory click
  const handleChildClick = (childId) => {
    navigate(`/subcategory/${childId}`);
  };

  if (loading) {
    return <Loading />;
  }

  if (!subcategory) {
    return (
      <div className="subcategory-page">
        <div className="container">
          <div className="not-found">
            <h2>{isRTL ? 'القسم غير موجود' : 'Subcategory Not Found'}</h2>
            <p>{isRTL ? 'عذرا، لم نتمكن من العثور على هذا القسم' : 'Sorry, we could not find this subcategory'}</p>
            <Link to="/products" className="btn btn-primary">
              {isRTL ? 'تصفح المنتجات' : 'Browse Products'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const children = subcategory.children || [];
  const hasChildren = children.length > 0;
  const parentSubcategory = subcategory.parent;

  return (
    <div className="subcategory-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-wrapper">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">{t('nav.home') || (isRTL ? 'الرئيسية' : 'Home')}</Link>
            <ArrowIcon className="breadcrumb-separator" />
            <Link to="/categories">{isRTL ? 'التصنيفات' : 'Categories'}</Link>
            <ArrowIcon className="breadcrumb-separator" />
            {subcategory.category_id && (
              <>
                <Link to={`/category/${subcategory.category_id}`}>
                  {subcategory.category_name || (isRTL ? 'التصنيف' : 'Category')}
                </Link>
                <ArrowIcon className="breadcrumb-separator" />
              </>
            )}
            {parentSubcategory && (
              <>
                <Link to={`/subcategory/${parentSubcategory.subcategory_id}`}>
                  {getLocalized(parentSubcategory, 'name')}
                </Link>
                <ArrowIcon className="breadcrumb-separator" />
              </>
            )}
            <span className="current">{getLocalized(subcategory, 'name')}</span>
          </nav>
        </div>
      </div>

      {/* Subcategory Header */}
      <section className="subcategory-header">
        <div className="container">
          {subcategory.image_url && (
            <div className="subcategory-banner">
              <img
                src={getImageUrl(subcategory.image_url)}
                alt={getLocalized(subcategory, 'name')}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="subcategory-banner-overlay" />
            </div>
          )}
          <div className="subcategory-info">
            <h1 className="subcategory-title">{getLocalized(subcategory, 'name')}</h1>
            {subcategory.description && (
              <p className="subcategory-description">{subcategory.description}</p>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        {/* Child Subcategories Section */}
        {hasChildren && (
          <section className="children-section">
            <h2 className="section-title">
              {isRTL ? 'الأقسام الفرعية' : 'Subcategories'}
            </h2>
            <div className="children-grid">
              {children.map((child) => (
                <button
                  key={child.subcategory_id}
                  onClick={() => handleChildClick(child.subcategory_id)}
                  className="child-card"
                >
                  <div className="child-image">
                    {child.image_url ? (
                      <img
                        src={getImageUrl(child.image_url)}
                        alt={getLocalized(child, 'name')}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="child-placeholder">
                        <span>{getLocalized(child, 'name')?.charAt(0) || '?'}</span>
                      </div>
                    )}
                  </div>
                  <div className="child-info">
                    <h3 className="child-name">{getLocalized(child, 'name')}</h3>
                    <div className="child-meta">
                      {child.children_count > 0 && (
                        <span className="child-count">
                          {child.children_count} {isRTL ? 'قسم فرعي' : 'subcategories'}
                        </span>
                      )}
                      {child.product_count > 0 && (
                        <span className="child-count">
                          {child.product_count} {isRTL ? 'منتج' : 'products'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowIcon className="child-arrow" />
                </button>
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
              <p>{isRTL ? 'لا توجد منتجات في هذا القسم' : 'No products in this subcategory'}</p>
              {hasChildren && (
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

        {/* Back Navigation */}
        <div className="back-navigation">
          {parentSubcategory ? (
            <Link to={`/subcategory/${parentSubcategory.subcategory_id}`} className="back-link">
              <FiChevronLeft className="back-icon" />
              {isRTL ? 'العودة إلى' : 'Back to'} {getLocalized(parentSubcategory, 'name')}
            </Link>
          ) : subcategory.category_id && (
            <Link to={`/category/${subcategory.category_id}`} className="back-link">
              <FiChevronLeft className="back-icon" />
              {isRTL ? 'العودة إلى التصنيف' : 'Back to Category'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubcategoryPage;
