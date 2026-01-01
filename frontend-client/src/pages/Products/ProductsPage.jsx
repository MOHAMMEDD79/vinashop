import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { productApi, categoryApi, filterApi } from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';
import { SORT_OPTIONS, PAGINATION } from '../../utils/constants';
import './ProductsPage.css';

const ProductsPage = () => {
  const { t, getLocalized, isRTL, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [optionTypes, setOptionTypes] = useState([]); // Dynamic option types (replaces colors/sizes)
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT,
    totalPages: 0
  });

  // Get selected options from URL (option_1=5, option_2=10, etc.)
  const getSelectedOptions = () => {
    const options = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('option_')) {
        const typeId = key.replace('option_', '');
        options[typeId] = value;
      }
    }
    return options;
  };

  // Filters from URL
  const filters = {
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1,
    options: getSelectedOptions() // Dynamic options object { typeId: valueId }
  };

  // Check if any option filters are active
  const hasActiveOptions = useMemo(() => {
    return Object.keys(filters.options).length > 0;
  }, [searchParams]);

  // Fetch filter options (categories and dynamic option types)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const categoryId = filters.category || null;
        const [categoriesRes, optionTypesRes] = await Promise.allSettled([
          categoryApi.getAll(language),
          filterApi.getOptionTypes(language, categoryId)
        ]);

        if (categoriesRes.status === 'fulfilled') {
          setCategories(categoriesRes.value.categories || []);
        }
        if (optionTypesRes.status === 'fulfilled') {
          // Option types with their values (e.g., Color, Size, Material, etc.)
          // Backend returns: { success: true, options: [...] }
          setOptionTypes(optionTypesRes.value.options || optionTypesRes.value.option_types || optionTypesRes.value.optionTypes || []);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, [language, filters.category]); // Refetch when language or category changes

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await productApi.getAll({
          ...filters,
          lang: language,
          limit: PAGINATION.DEFAULT_LIMIT
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
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, language]);

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

  // Clear all filters including dynamic options
  const clearFilters = () => {
    setSearchParams({});
  };

  // Update option filter (for dynamic option types)
  const updateOptionFilter = (typeId, valueId) => {
    const newParams = new URLSearchParams(searchParams);
    const key = `option_${typeId}`;
    const currentValue = newParams.get(key);

    if (currentValue === String(valueId)) {
      // Deselect if already selected
      newParams.delete(key);
    } else {
      // Select new value
      newParams.set(key, valueId);
    }
    newParams.delete('page'); // Reset pagination
    setSearchParams(newParams);
  };

  const hasActiveFilters = filters.category || filters.subcategory || filters.minPrice || filters.maxPrice || hasActiveOptions;

  return (
    <div className="products-page">
      <div className="container">
        {/* Header */}
        <div className="products-header">
          <div className="products-title-section">
            <h1 className="products-title">{t('products.title')}</h1>
            {filters.search && (
              <p className="search-query">
                {isRTL ? `نتائج البحث عن: "${filters.search}"` : `Search results for: "${filters.search}"`}
              </p>
            )}
          </div>

          <div className="products-controls">
            <button
              className="filter-toggle-btn"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <FiFilter />
              {t('products.filters')}
            </button>

            <div className="sort-control">
              <label>{t('products.sort')}:</label>
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

        <div className="products-layout">
          {/* Sidebar Filters */}
          <aside className={`filters-sidebar ${filtersOpen ? 'open' : ''}`}>
            <div className="filters-header">
              <h3>{t('products.filters')}</h3>
              <button
                className="filters-close"
                onClick={() => setFiltersOpen(false)}
              >
                <FiX />
              </button>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                {t('products.clearFilters')}
              </button>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="filter-group">
                <h4 className="filter-title">{t('products.category')}</h4>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={!filters.category}
                      onChange={() => updateFilter('category', '')}
                    />
                    <span>{t('products.all')}</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.category_id} className="filter-option">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === String(cat.category_id)}
                        onChange={() => updateFilter('category', cat.category_id)}
                      />
                      <span>{getLocalized(cat, 'name')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className="filter-group">
              <h4 className="filter-title">{t('products.priceRange')}</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder={t('products.minPrice')}
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('min_price', e.target.value)}
                  className="price-input"
                  min="0"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder={t('products.maxPrice')}
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('max_price', e.target.value)}
                  className="price-input"
                  min="0"
                />
              </div>
            </div>

            {/* Dynamic Option Type Filters */}
            {optionTypes.map((optionType) => {
              const typeId = optionType.type_id || optionType.option_type_id;
              const values = optionType.values || optionType.option_values || [];
              const isColorType = optionType.display_type === 'color' ||
                                  optionType.name?.toLowerCase().includes('color') ||
                                  optionType.name?.toLowerCase().includes('لون');

              if (values.length === 0) return null;

              return (
                <div key={typeId} className="filter-group">
                  <h4 className="filter-title">{getLocalized(optionType, 'name')}</h4>
                  {isColorType ? (
                    // Color swatch display
                    <div className="color-options">
                      {values.map((value) => {
                        const valueId = value.value_id || value.option_value_id;
                        const isSelected = filters.options[typeId] === String(valueId);
                        return (
                          <button
                            key={valueId}
                            className={`color-option ${isSelected ? 'active' : ''}`}
                            style={{ backgroundColor: value.color_code || value.hex_code || '#ccc' }}
                            onClick={() => updateOptionFilter(typeId, valueId)}
                            title={getLocalized(value, 'value') || getLocalized(value, 'name')}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    // Button/text display for sizes, materials, etc.
                    <div className="size-options">
                      {values.map((value) => {
                        const valueId = value.value_id || value.option_value_id;
                        const isSelected = filters.options[typeId] === String(valueId);
                        return (
                          <button
                            key={valueId}
                            className={`size-option ${isSelected ? 'active' : ''}`}
                            onClick={() => updateOptionFilter(typeId, valueId)}
                          >
                            {getLocalized(value, 'value') || getLocalized(value, 'name')}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          {/* Products Grid */}
          <main className="products-main">
            {loading ? (
              <Loading />
            ) : products.length === 0 ? (
              <div className="no-products">
                <p>{t('products.noResults')}</p>
                <span>{t('products.tryDifferent')}</span>
                {hasActiveFilters && (
                  <button className="btn btn-primary" onClick={clearFilters}>
                    {t('products.clearFilters')}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="products-info">
                  <span>
                    {t('products.showing')} {products.length} {t('products.of')} {pagination.total} {t('products.results')}
                  </span>
                </div>

                <div className="products-grid">
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
          </main>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {filtersOpen && (
        <div className="filters-overlay" onClick={() => setFiltersOpen(false)} />
      )}
    </div>
  );
};

export default ProductsPage;
