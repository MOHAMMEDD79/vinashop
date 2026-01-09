import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiRefreshCw, FiImage, FiUpload, FiStar, FiCheck, FiSearch, FiPackage } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { getImageUrl } from '../../utils/imageUrl';

const Products = () => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [optionTypes, setOptionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [filters, setFilters] = useState({ search: '', category_id: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const fileInputRef = useRef(null);

  // Product options section visibility
  const [showOptionsSection, setShowOptionsSection] = useState(false);

  const [formData, setFormData] = useState({
    product_name_en: '',
    product_name_ar: '',
    product_description_en: '',
    product_description_ar: '',
    base_price: '',
    discount_percentage: 0,
    category_id: '',
    subcategory_id: '',
    stock_quantity: 0,
    sku: '',
    is_active: true,
    is_featured: false,
    meta_keywords: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchOptionTypes();
    // DEPRECATED: fetchColors() and fetchSizes() removed in Phase 6
    // Colors and sizes are now managed through optionTypes
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/test/products-list', {
        params: { ...filters, page: pagination.page, limit: pagination.limit }
      });
      const data = res.data.data;
      setProducts(data?.items || []);
      setPagination(prev => ({ ...prev, total: data?.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/test/categories-list');
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchOptionTypes = async () => {
    try {
      const res = await api.get('/test/option-types');
      setOptionTypes(res.data.data || []);
    } catch (error) {
      console.error('Error fetching option types:', error);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    try {
      const res = await api.get(`/subcategories/category/${categoryId}/tree`);
      // Flatten the tree for dropdown
      const flattenTree = (items, level = 0) => {
        let result = [];
        for (const item of items) {
          result.push({ ...item, level });
          if (item.children && item.children.length > 0) {
            result = result.concat(flattenTree(item.children, level + 1));
          }
        }
        return result;
      };
      const tree = res.data.data || res.data || [];
      setSubcategories(flattenTree(tree));
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  const toggleOptionValue = (valueId) => {
    setSelectedOptions(prev =>
      prev.includes(valueId)
        ? prev.filter(id => id !== valueId)
        : [...prev, valueId]
    );
  };

  const fetchProductImages = async (productId) => {
    try {
      const res = await api.get(`/test/products/${productId}/images`);
      setProductImages(res.data.data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setProductImages([]);
    }
  };

  const generateSKU = async () => {
    try {
      const prefix = formData.product_name_en
        ? formData.product_name_en.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
        : 'PRD';
      const res = await api.get('/test/generate-sku', { params: { prefix } });
      if (res.data.success) {
        setFormData({ ...formData, sku: res.data.data.sku });
      }
    } catch (error) {
      const prefix = formData.product_name_en
        ? formData.product_name_en.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
        : 'PRD';
      const timestamp = Date.now().toString(36).toUpperCase();
      setFormData({ ...formData, sku: `${prefix}-${timestamp}` });
    }
  };

  // Handle file selection for product images
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove selected file
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files to product
  const uploadProductImages = async (productId) => {
    if (selectedFiles.length === 0) return;

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      await api.post(`/test/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast.error(t('app.error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product_name_en) {
      toast.error(t('validation.required'));
      return;
    }
    if (!formData.base_price || formData.base_price <= 0) {
      toast.error(t('validation.required'));
      return;
    }
    if (!formData.category_id) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      setUploading(true);
      const submitData = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category_id: parseInt(formData.category_id),
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        is_active: formData.is_active ? 1 : 0,
        is_featured: formData.is_featured ? 1 : 0,
        meta_keywords: formData.meta_keywords || null,
        option_values: selectedOptions
      };

      let productId;
      if (editingProduct) {
        await api.put(`/test/products/${editingProduct.product_id}`, submitData);
        productId = editingProduct.product_id;
      } else {
        const res = await api.post('/test/products', submitData);
        productId = res.data.data.product_id;
      }

      // Save product options (selectedOptions contains option_value_ids)
      if (selectedOptions.length > 0) {
        try {
          await api.put(`/product-options/products/${productId}`, {
            option_value_ids: selectedOptions
          });
        } catch (optionError) {
          console.error('Failed to save product options:', optionError);
          toast.error(t('productOptions.saveFailed') || 'Failed to save product options');
        }
      } else {
        // Clear options if none selected
        try {
          await api.put(`/product-options/products/${productId}`, {
            option_value_ids: []
          });
        } catch (optionError) {
          console.error('Failed to clear product options:', optionError);
        }
      }

      // Upload selected image files
      if (selectedFiles.length > 0) {
        await uploadProductImages(productId);
      }

      toast.success(t('app.success'));

      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      const message = error.response?.data?.message || t('app.error');
      toast.error(message);
      console.error('Error:', error.response?.data);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('products.deleteConfirm'))) return;
    try {
      await api.delete(`/test/products/${id}`);
      toast.success(t('app.success'));
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await api.patch(`/test/products/${product.product_id}/toggle-status`);
      toast.success(t('app.success'));
      fetchProducts();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const openEditModal = async (product) => {
    setEditingProduct(product);

    try {
      const res = await api.get(`/test/products/${product.product_id}`);
      const fullProduct = res.data.data;

      // Fetch subcategories for this category
      if (fullProduct.category_id) {
        await fetchSubcategories(fullProduct.category_id);
      }

      setFormData({
        product_name_en: fullProduct.product_name_en || '',
        product_name_ar: fullProduct.product_name_ar || '',
        product_description_en: fullProduct.product_description_en || '',
        product_description_ar: fullProduct.product_description_ar || '',
        base_price: fullProduct.base_price || '',
        discount_percentage: fullProduct.discount_percentage || 0,
        category_id: fullProduct.category_id || '',
        subcategory_id: fullProduct.subcategory_id || '',
        stock_quantity: fullProduct.stock_quantity || 0,
        sku: fullProduct.sku || '',
        is_active: fullProduct.is_active === 1 || fullProduct.is_active === true,
        is_featured: fullProduct.is_featured === 1 || fullProduct.is_featured === true,
        meta_keywords: fullProduct.meta_keywords || ''
      });
      // Load existing product options
      setSelectedOptions(fullProduct.option_values?.map(ov => ov.option_value_id) || []);
    } catch (error) {
      console.error('Error loading product details:', error);

      // Fetch subcategories for fallback
      if (product.category_id) {
        await fetchSubcategories(product.category_id);
      }

      setFormData({
        product_name_en: product.product_name_en || '',
        product_name_ar: product.product_name_ar || '',
        product_description_en: product.product_description_en || '',
        product_description_ar: product.product_description_ar || '',
        base_price: product.base_price || '',
        discount_percentage: product.discount_percentage || 0,
        category_id: product.category_id || '',
        subcategory_id: product.subcategory_id || '',
        stock_quantity: product.stock_quantity || 0,
        sku: product.sku || '',
        is_active: product.is_active === 1 || product.is_active === true,
        is_featured: product.is_featured === 1 || product.is_featured === true,
        meta_keywords: product.meta_keywords || ''
      });
      setSelectedOptions([]);
    }
    setSelectedFiles([]);
    setFilePreviews([]);
    setShowModal(true);
  };

  const openImageModal = async (product) => {
    setSelectedProduct(product);
    await fetchProductImages(product.product_id);
    setShowImageModal(true);
  };

  const handleAddImageFile = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !selectedProduct) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      await api.post(`/test/products/${selectedProduct.product_id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('app.success'));
      e.target.value = ''; // Reset file input
      fetchProductImages(selectedProduct.product_id);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm(t('app.confirm'))) return;
    try {
      await api.delete(`/test/products/${selectedProduct.product_id}/images/${imageId}`);
      toast.success(t('app.success'));
      fetchProductImages(selectedProduct.product_id);
      fetchProducts();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await api.patch(`/test/products/${selectedProduct.product_id}/images/${imageId}/primary`);
      toast.success(t('app.success'));
      fetchProductImages(selectedProduct.product_id);
      fetchProducts();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setSelectedFiles([]);
    setFilePreviews([]);
    setSelectedOptions([]);
    setSubcategories([]);
    setFormData({
      product_name_en: '',
      product_name_ar: '',
      product_description_en: '',
      product_description_ar: '',
      base_price: '',
      discount_percentage: 0,
      category_id: '',
      subcategory_id: '',
      stock_quantity: 0,
      sku: '',
      is_active: true,
      is_featured: false,
      meta_keywords: ''
    });
  };

  // Handle category change - fetch subcategories
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setFormData({ ...formData, category_id: categoryId, subcategory_id: '' });
    await fetchSubcategories(categoryId);
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('products.title')}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <FiPlus /> {t('products.addProduct')}
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder={t('app.search')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}>
          <option value="">{t('app.all')} {t('categories.title')}</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>{cat.category_name_en}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">{t('app.all')} {t('app.status')}</option>
          <option value="active">{t('app.active')}</option>
          <option value="inactive">{t('app.inactive')}</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('products.images')}</th>
                <th>{t('products.productName')}</th>
                <th>{t('products.category')}</th>
                <th>{t('products.price')}</th>
                <th>{t('products.stock')}</th>
                <th>{t('app.status')}</th>
                <th>{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">{t('products.noProducts')}</td></tr>
              ) : (
                products.map(product => (
                  <tr key={product.product_id}>
                    <td>
                      {product.image_url ? (
                        <img
                          src={getImageUrl(product.image_url)}
                          alt=""
                          className="image-preview"
                          style={{ cursor: 'pointer' }}
                          onClick={() => openImageModal(product)}
                        />
                      ) : (
                        <div
                          className="image-preview"
                          style={{ background: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => openImageModal(product)}
                        >
                          <FiImage color="#94a3b8" />
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{product.product_name_en}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.sku}</div>
                    </td>
                    <td>{product.category_name || '-'}</td>
                    <td>
                      ₪{parseFloat(product.base_price || 0).toFixed(2)}
                      {product.discount_percentage > 0 && (
                        <span style={{ color: '#22c55e', marginLeft: 5, fontSize: '0.8rem' }}>
                          -{product.discount_percentage}%
                        </span>
                      )}
                    </td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <span
                        className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleToggleStatus(product)}
                      >
                        {product.is_active ? t('app.active') : t('app.inactive')}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" onClick={() => openImageModal(product)} title={t('products.images')}>
                          <FiImage />
                        </button>
                        <button className="btn-icon edit" onClick={() => openEditModal(product)} title={t('app.edit')}>
                          <FiEdit2 />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(product.product_id)} title={t('app.delete')}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.total > pagination.limit && (
          <div className="pagination">
            {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => (
              <button
                key={i + 1}
                className={pagination.page === i + 1 ? 'active' : ''}
                onClick={() => setPagination({ ...pagination, page: i + 1 })}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>{editingProduct ? t('products.editProduct') : t('products.addProduct')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>

                {/* Image Upload Section */}
                <div className="form-group">
                  <label><FiImage style={{ marginRight: '0.5rem' }} />{t('products.images')}</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: '10px',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: '#f8fafc',
                      marginBottom: '10px'
                    }}
                  >
                    <FiUpload style={{ fontSize: '2rem', color: '#64748b', marginBottom: '10px' }} />
                    <p style={{ color: '#64748b', margin: 0 }}>{t('products.clickToUpload')}</p>
                  </div>
                  {/* Preview selected files */}
                  {filePreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                      {filePreviews.map((preview, index) => (
                        <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img src={preview} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Names */}
                <h4 style={{ marginBottom: '1rem', color: '#64748b' }}>{t('products.productName')}</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('products.productNameEn')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.product_name_en}
                      onChange={(e) => setFormData({ ...formData, product_name_en: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('products.productNameAr')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.product_name_ar}
                      onChange={(e) => setFormData({ ...formData, product_name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#64748b' }}>{t('products.description')}</h4>
                <div className="form-group">
                  <label>{t('products.descriptionEn')}</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.product_description_en}
                    onChange={(e) => setFormData({ ...formData, product_description_en: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('products.descriptionAr')}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.product_description_ar}
                    onChange={(e) => setFormData({ ...formData, product_description_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>

                {/* Pricing */}
                <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#64748b' }}>{t('products.basePrice')} & {t('products.stock')}</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('products.basePrice')} (₪) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('products.discount')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('products.category')} *</label>
                    <select
                      className="form-control"
                      value={formData.category_id}
                      onChange={handleCategoryChange}
                      required
                    >
                      <option value="">{t('products.selectCategory')}</option>
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>{cat.category_name_en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('products.subcategory') || 'Subcategory'}</label>
                    <select
                      className="form-control"
                      value={formData.subcategory_id}
                      onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                      disabled={!formData.category_id || subcategories.length === 0}
                    >
                      <option value="">{t('products.selectSubcategory') || 'Select Subcategory'}</option>
                      {subcategories.map(sub => (
                        <option key={sub.subcategory_id} value={sub.subcategory_id}>
                          {'—'.repeat(sub.level || 0)} {sub.subcategory_name || sub.subcategory_name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product Options */}
                {optionTypes.length > 0 && (
                  <>
                    <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#64748b' }}>{t('productOptions.title')}</h4>
                    <div style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1rem',
                      background: '#f8fafc'
                    }}>
                      {optionTypes.filter(type => type.is_active && type.values?.length > 0).map(type => (
                        <div key={type.option_type_id} style={{ marginBottom: '1rem' }}>
                          <label style={{
                            display: 'block',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            color: '#374151'
                          }}>
                            {type.type_name_en}
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {type.values.filter(v => v.is_active).map(value => (
                              <label
                                key={value.option_value_id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '6px',
                                  border: selectedOptions.includes(value.option_value_id)
                                    ? '2px solid #3b82f6'
                                    : '1px solid #d1d5db',
                                  background: selectedOptions.includes(value.option_value_id)
                                    ? '#eff6ff'
                                    : 'white',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  fontSize: '0.9rem'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedOptions.includes(value.option_value_id)}
                                  onChange={() => toggleOptionValue(value.option_value_id)}
                                  style={{ marginRight: '0.5rem' }}
                                />
                                {value.value_name_en}
                                {value.additional_price && parseFloat(value.additional_price) !== 0 && (
                                  <span style={{
                                    marginLeft: '0.5rem',
                                    color: parseFloat(value.additional_price) > 0 ? '#22c55e' : '#ef4444',
                                    fontSize: '0.8rem'
                                  }}>
                                    {parseFloat(value.additional_price) > 0 ? '+' : ''}₪{parseFloat(value.additional_price).toFixed(2)}
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      {optionTypes.filter(type => type.is_active && type.values?.length > 0).length === 0 && (
                        <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                          {t('productOptions.noOptionTypes')}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('products.stock')}</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>{t('products.sku')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder={t('products.sku')}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={generateSKU}
                        title={t('products.sku')}
                      >
                        <FiRefreshCw />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SEO / Meta Fields */}
                <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#64748b' }}>
                  <FiSearch style={{ marginRight: '0.5rem' }} />
                  {t('products.keywords')}
                </h4>
                <div className="form-group">
                  <label>{t('products.keywords')}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    placeholder={t('products.keywords')}
                  />
                </div>

                {/* Status */}
                <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#64748b' }}>{t('app.status')}</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {t('app.active')}
                    </label>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {t('products.featured')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? t('app.loading') : (editingProduct ? t('app.save') : t('app.add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {showImageModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>
                <FiImage style={{ marginRight: '0.5rem' }} />
                {t('products.images')} - {selectedProduct.product_name_en}
              </h3>
              <button className="btn-icon" onClick={() => setShowImageModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">

              {/* Current Images */}
              <h4 style={{ marginBottom: '1rem', color: '#64748b' }}>{t('products.images')} ({productImages.length})</h4>

              {productImages.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <FiImage size={40} color="#cbd5e1" />
                  <p style={{ margin: '1rem 0 0', color: '#94a3b8' }}>{t('app.noData')}</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  {productImages.map(image => {
                    const isPrimary = image.is_primary === 1 || image.is_primary === true;
                    return (
                    <div
                      key={image.image_id}
                      style={{
                        position: 'relative',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: isPrimary ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                        background: '#fff',
                        boxShadow: isPrimary ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <img
                        src={getImageUrl(image.image_url)}
                        alt={`Product image ${image.display_order || ''}`}
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect fill="%23f1f5f9" width="180" height="180"/><text x="50%" y="50%" fill="%2394a3b8" text-anchor="middle" dy=".3em" font-size="14">Image Error</text></svg>';
                        }}
                      />

                      {/* Primary Badge */}
                      {isPrimary ? (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: '#3b82f6',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          <FiCheck size={12} /> Primary
                        </div>
                      ) : null}

                      {/* Action Buttons */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        padding: '2rem 0.75rem 0.75rem',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(image.image_id)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <FiStar size={12} /> Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.image_id)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem'
                          }}
                        >
                          <FiTrash2 size={12} /> {t('app.delete')}
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}

              {/* Upload New Images */}
              <h4 style={{ marginBottom: '1rem', color: '#64748b' }}>{t('products.uploadImages')}</h4>
              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                background: '#f8fafc',
                transition: 'all 0.2s'
              }}>
                <FiUpload size={40} color="#94a3b8" />
                <p style={{ margin: '1rem 0 0.5rem', color: '#64748b' }}>
                  {t('products.clickToUpload')}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddImageFile}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    maxWidth: '300px'
                  }}
                  disabled={uploading}
                />
                {uploading && <p style={{ color: '#3b82f6', marginTop: '0.5rem' }}>{t('app.loading')}</p>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowImageModal(false)}>{t('app.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
