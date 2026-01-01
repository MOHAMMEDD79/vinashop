import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiUpload, FiChevronDown, FiChevronRight, FiFolder, FiFolderPlus } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { getImageUrl } from '../../utils/imageUrl';

const Categories = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Subcategory states
  const [expandedCategories, setExpandedCategories] = useState({});
  const [subcategories, setSubcategories] = useState({});
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [expandedSubcategories, setExpandedSubcategories] = useState({});

  const [formData, setFormData] = useState({
    category_name_en: '',
    category_name_ar: '',
    category_description_en: '',
    category_description_ar: '',
    display_order: 0,
    is_active: true,
    is_featured: false
  });

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    subcategory_name_en: '',
    subcategory_name_ar: '',
    subcategory_description_en: '',
    subcategory_description_ar: '',
    category_id: null,
    parent_id: null,
    display_order: 0,
    is_active: true,
    subcategory_image: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/test/categories-list');
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch subcategories for a category
  const fetchSubcategories = async (categoryId) => {
    try {
      const res = await api.get(`/subcategories/category/${categoryId}/tree`);
      setSubcategories(prev => ({
        ...prev,
        [categoryId]: res.data.data || []
      }));
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  // Toggle category expansion
  const toggleCategoryExpand = async (categoryId) => {
    const isExpanded = expandedCategories[categoryId];
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !isExpanded
    }));

    if (!isExpanded && !subcategories[categoryId]) {
      await fetchSubcategories(categoryId);
    }
  };

  // Toggle subcategory expansion (for nested)
  const toggleSubcategoryExpand = (subcategoryId) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category_name_en) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      setUploading(true);
      const submitData = {
        ...formData,
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active ? 1 : 0,
        is_featured: formData.is_featured ? 1 : 0
      };

      let categoryId;
      if (editingCategory) {
        await api.put(`/test/categories/${editingCategory.category_id}`, submitData);
        categoryId = editingCategory.category_id;
        toast.success(t('app.success'));
      } else {
        const res = await api.post('/test/categories', submitData);
        categoryId = res.data.data.category_id;
        toast.success(t('app.success'));
      }

      // Upload image file if selected
      if (selectedFile && categoryId) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        await api.post(`/test/categories/${categoryId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setUploading(false);
    }
  };

  // Subcategory form submit
  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();

    if (!subcategoryFormData.subcategory_name_en) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      setUploading(true);
      const submitData = {
        ...subcategoryFormData,
        display_order: parseInt(subcategoryFormData.display_order) || 0,
        is_active: subcategoryFormData.is_active ? 1 : 0
      };

      if (editingSubcategory) {
        await api.put(`/subcategories/${editingSubcategory.subcategory_id}`, submitData);
        toast.success(t('app.success'));
      } else {
        await api.post('/subcategories', submitData);
        toast.success(t('app.success'));
      }

      setShowSubcategoryModal(false);
      resetSubcategoryForm();

      // Refresh subcategories for the category
      if (subcategoryFormData.category_id) {
        await fetchSubcategories(subcategoryFormData.category_id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('categories.deleteConfirm'))) return;
    try {
      await api.delete(`/test/categories/${id}`);
      toast.success(t('app.success'));
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDeleteSubcategory = async (subcategory) => {
    if (!window.confirm(t('categories.deleteConfirm'))) return;
    try {
      await api.delete(`/subcategories/${subcategory.subcategory_id}`);
      toast.success(t('app.success'));
      await fetchSubcategories(subcategory.category_id);
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await api.patch(`/test/categories/${category.category_id}/toggle-status`);
      toast.success(t('app.success'));
      fetchCategories();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleToggleSubcategoryStatus = async (subcategory) => {
    try {
      await api.patch(`/subcategories/${subcategory.subcategory_id}/status`);
      toast.success(t('app.success'));
      await fetchSubcategories(subcategory.category_id);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name_en: category.category_name_en || '',
      category_name_ar: category.category_name_ar || '',
      category_description_en: category.category_description_en || '',
      category_description_ar: category.category_description_ar || '',
      display_order: category.display_order || 0,
      is_active: category.is_active === 1 || category.is_active === true,
      is_featured: category.is_featured === 1 || category.is_featured === true
    });
    setSelectedFile(null);
    setFilePreview(null);
    setShowModal(true);
  };

  const openSubcategoryModal = (categoryId, parentId = null, subcategory = null) => {
    if (subcategory) {
      // Editing existing subcategory
      setEditingSubcategory(subcategory);
      setSubcategoryFormData({
        subcategory_name_en: subcategory.subcategory_name_en || subcategory.nameEn || '',
        subcategory_name_ar: subcategory.subcategory_name_ar || subcategory.nameAr || '',
        subcategory_description_en: subcategory.description_en || '',
        subcategory_description_ar: subcategory.description_ar || '',
        category_id: subcategory.category_id,
        parent_id: subcategory.parent_id,
        display_order: subcategory.display_order || 0,
        is_active: subcategory.is_active === 1 || subcategory.is_active === true,
        subcategory_image: subcategory.image_url || subcategory.subcategory_image || ''
      });
    } else {
      // Creating new subcategory
      setEditingSubcategory(null);
      setSubcategoryFormData({
        subcategory_name_en: '',
        subcategory_name_ar: '',
        subcategory_description_en: '',
        subcategory_description_ar: '',
        category_id: categoryId,
        parent_id: parentId,
        display_order: 0,
        is_active: true,
        subcategory_image: ''
      });
    }
    setShowSubcategoryModal(true);
  };

  const openImageModal = (category) => {
    setSelectedCategory(category);
    setShowImageModal(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setSelectedFile(null);
    setFilePreview(null);
    setFormData({
      category_name_en: '',
      category_name_ar: '',
      category_description_en: '',
      category_description_ar: '',
      display_order: 0,
      is_active: true,
      is_featured: false
    });
  };

  const resetSubcategoryForm = () => {
    setEditingSubcategory(null);
    setSubcategoryFormData({
      subcategory_name_en: '',
      subcategory_name_ar: '',
      subcategory_description_en: '',
      subcategory_description_ar: '',
      category_id: null,
      parent_id: null,
      display_order: 0,
      is_active: true,
      subcategory_image: ''
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedCategory) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      await api.post(`/test/categories/${selectedCategory.category_id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('app.success'));
      e.target.value = '';
      fetchCategories();
      setShowImageModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!selectedCategory) return;
    if (!window.confirm(t('app.confirm'))) return;

    try {
      setUploading(true);
      await api.delete(`/test/categories/${selectedCategory.category_id}/image`);
      toast.success(t('app.success'));
      fetchCategories();
      setSelectedCategory({ ...selectedCategory, category_image: null });
    } catch (error) {
      toast.error(t('app.error'));
    } finally {
      setUploading(false);
    }
  };

  // Render subcategory tree recursively
  const renderSubcategoryTree = (items, level = 0, categoryId) => {
    if (!items || items.length === 0) return null;

    return (
      <div style={{ marginLeft: level > 0 ? '24px' : '0' }}>
        {items.map(sub => (
          <div key={sub.subcategory_id} className="subcategory-item">
            <div
              className="subcategory-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: level % 2 === 0 ? '#fafafa' : '#fff'
              }}
            >
              {/* Expand/Collapse for nested */}
              <div style={{ width: '24px' }}>
                {sub.children && sub.children.length > 0 ? (
                  <button
                    className="btn-icon"
                    onClick={() => toggleSubcategoryExpand(sub.subcategory_id)}
                    style={{ padding: '2px' }}
                  >
                    {expandedSubcategories[sub.subcategory_id] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                ) : (
                  <span style={{ width: '14px', display: 'inline-block' }} />
                )}
              </div>

              {/* Folder Icon */}
              <FiFolder size={16} style={{ marginRight: '8px', color: '#94a3b8' }} />

              {/* Name */}
              <div style={{ flex: 1 }}>
                <strong>{sub.subcategory_name_en || sub.nameEn || sub.name}</strong>
                {sub.subcategory_name_ar && (
                  <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '0.85rem' }} dir="rtl">
                    ({sub.subcategory_name_ar || sub.nameAr})
                  </span>
                )}
              </div>

              {/* Product Count */}
              <span style={{ color: '#64748b', fontSize: '0.85rem', marginRight: '16px' }}>
                {sub.product_count || sub.productCount || 0} products
              </span>

              {/* Status */}
              <span
                className={`badge ${sub.is_active || sub.isActive ? 'badge-success' : 'badge-danger'}`}
                style={{ cursor: 'pointer', marginRight: '16px' }}
                onClick={() => handleToggleSubcategoryStatus({ ...sub, category_id: categoryId })}
              >
                {sub.is_active || sub.isActive ? t('app.active') : t('app.inactive')}
              </span>

              {/* Actions */}
              <div className="action-btns" style={{ gap: '4px' }}>
                <button
                  className="btn-icon"
                  onClick={() => openSubcategoryModal(categoryId, sub.subcategory_id || sub.id)}
                  title="Add Child Subcategory"
                  style={{ color: '#22c55e' }}
                >
                  <FiFolderPlus size={16} />
                </button>
                <button
                  className="btn-icon edit"
                  onClick={() => openSubcategoryModal(categoryId, null, { ...sub, category_id: categoryId })}
                  title={t('app.edit')}
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  className="btn-icon delete"
                  onClick={() => handleDeleteSubcategory({ ...sub, category_id: categoryId })}
                  title={t('app.delete')}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>

            {/* Render children if expanded */}
            {expandedSubcategories[sub.subcategory_id] && sub.children && sub.children.length > 0 && (
              renderSubcategoryTree(sub.children, level + 1, categoryId)
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('categories.title')}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <FiPlus /> {t('categories.addCategory')}
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>{t('categories.image')}</th>
                <th>{t('categories.categoryNameEn')}</th>
                <th>{t('categories.categoryNameAr')}</th>
                <th>{t('categories.productCount')}</th>
                <th>{t('categories.displayOrder')}</th>
                <th>{t('app.status')}</th>
                <th>{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">{t('categories.noCategories')}</td></tr>
              ) : (
                categories.map(category => (
                  <React.Fragment key={category.category_id}>
                    <tr>
                      {/* Expand button */}
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => toggleCategoryExpand(category.category_id)}
                          style={{ padding: '4px' }}
                        >
                          {expandedCategories[category.category_id] ? <FiChevronDown /> : <FiChevronRight />}
                        </button>
                      </td>
                      <td>
                        {category.category_image ? (
                          <img
                            src={getImageUrl(category.category_image)}
                            alt=""
                            className="image-preview"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23e2e8f0" width="40" height="40"/></svg>';
                            }}
                          />
                        ) : (
                          <div className="image-preview" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiImage color="#94a3b8" />
                          </div>
                        )}
                      </td>
                      <td><strong>{category.category_name_en}</strong></td>
                      <td dir="rtl">{category.category_name_ar || '-'}</td>
                      <td>{category.product_count || 0}</td>
                      <td>{category.display_order}</td>
                      <td>
                        <span
                          className={`badge ${category.is_active ? 'badge-success' : 'badge-danger'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleStatus(category)}
                        >
                          {category.is_active ? t('app.active') : t('app.inactive')}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="btn-icon"
                            onClick={() => openSubcategoryModal(category.category_id)}
                            title="Add Subcategory"
                            style={{ color: '#22c55e' }}
                          >
                            <FiFolderPlus />
                          </button>
                          <button className="btn-icon" onClick={() => openImageModal(category)} title={t('categories.image')} style={{ color: '#8b5cf6' }}>
                            <FiImage />
                          </button>
                          <button className="btn-icon edit" onClick={() => openEditModal(category)} title={t('app.edit')}>
                            <FiEdit2 />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDelete(category.category_id)} title={t('app.delete')}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Subcategories Row */}
                    {expandedCategories[category.category_id] && (
                      <tr>
                        <td colSpan="9" style={{ padding: 0, backgroundColor: '#f8fafc' }}>
                          <div style={{ padding: '16px', paddingLeft: '48px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h4 style={{ margin: 0, color: '#475569' }}>
                                <FiFolder style={{ marginRight: '8px' }} />
                                Subcategories
                              </h4>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => openSubcategoryModal(category.category_id)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                              >
                                <FiPlus size={14} style={{ marginRight: '4px' }} />
                                Add Subcategory
                              </button>
                            </div>
                            {subcategories[category.category_id] && subcategories[category.category_id].length > 0 ? (
                              renderSubcategoryTree(subcategories[category.category_id], 0, category.category_id)
                            ) : (
                              <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '12px' }}>
                                No subcategories yet. Click "Add Subcategory" to create one.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingCategory ? t('categories.editCategory') : t('categories.addCategory')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Image Upload Section */}
                <div className="form-group">
                  <label><FiImage style={{ marginRight: '0.5rem' }} />{t('categories.image')}</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
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
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }} />
                    ) : (
                      <>
                        <FiUpload style={{ fontSize: '2rem', color: '#64748b', marginBottom: '10px' }} />
                        <p style={{ color: '#64748b', margin: 0 }}>{t('products.clickToUpload')}</p>
                      </>
                    )}
                  </div>
                </div>

                {editingCategory?.category_image && !filePreview && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Current Image:</p>
                    <img
                      src={getImageUrl(editingCategory.category_image)}
                      alt=""
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                <h4 style={{ marginBottom: '1rem', color: '#64748b' }}>{t('categories.categoryName')}</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('categories.categoryNameEn')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.category_name_en}
                      onChange={(e) => setFormData({ ...formData, category_name_en: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('categories.categoryNameAr')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.category_name_ar}
                      onChange={(e) => setFormData({ ...formData, category_name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>

                <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#64748b' }}>{t('categories.description')}</h4>
                <div className="form-group">
                  <label>{t('categories.description')} (EN)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.category_description_en}
                    onChange={(e) => setFormData({ ...formData, category_description_en: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('categories.description')} (AR)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.category_description_ar}
                    onChange={(e) => setFormData({ ...formData, category_description_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>

                <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#64748b' }}>{t('settings.title')}</h4>
                <div className="form-group">
                  <label>{t('categories.displayOrder')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    min="0"
                  />
                </div>

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
                  {uploading ? t('app.loading') : (editingCategory ? t('app.save') : t('app.add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="modal-overlay" onClick={() => setShowSubcategoryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>
                <FiFolder style={{ marginRight: '8px' }} />
                {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
                {subcategoryFormData.parent_id && ' (Nested)'}
              </h3>
              <button className="btn-icon" onClick={() => setShowSubcategoryModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubcategorySubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Image URL */}
                <div className="form-group">
                  <label>Subcategory Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={subcategoryFormData.subcategory_image}
                    onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, subcategory_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Names */}
                <h4 style={{ marginBottom: '1rem', color: '#64748b' }}>Subcategory Name</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name (English) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={subcategoryFormData.subcategory_name_en}
                      onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, subcategory_name_en: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Name (Arabic)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={subcategoryFormData.subcategory_name_ar}
                      onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, subcategory_name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: '#64748b' }}>Description</h4>
                <div className="form-group">
                  <label>Description (English)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={subcategoryFormData.subcategory_description_en}
                    onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, subcategory_description_en: e.target.value })}
                  />
                </div>

                {/* Settings */}
                <div className="form-row" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={subcategoryFormData.display_order}
                      onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, display_order: e.target.value })}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '1.5rem' }}>
                      <input
                        type="checkbox"
                        checked={subcategoryFormData.is_active}
                        onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, is_active: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {t('app.active')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubcategoryModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? t('app.loading') : (editingSubcategory ? t('app.save') : t('app.add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {showImageModal && selectedCategory && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>
                <FiImage style={{ marginRight: '0.5rem' }} />
                {t('categories.image')} - {selectedCategory.category_name_en}
              </h3>
              <button className="btn-icon" onClick={() => setShowImageModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                {selectedCategory.category_image ? (
                  <div>
                    <img
                      src={getImageUrl(selectedCategory.category_image)}
                      alt=""
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '3px solid #e2e8f0',
                        marginBottom: '1rem'
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleImageDelete}
                      disabled={uploading}
                      style={{ display: 'block', margin: '0 auto' }}
                    >
                      <FiTrash2 style={{ marginRight: '0.5rem' }} />
                      {t('app.delete')}
                    </button>
                  </div>
                ) : (
                  <div style={{
                    width: '200px',
                    height: '200px',
                    background: '#f1f5f9',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <FiImage size={48} color="#94a3b8" />
                    <p style={{ color: '#94a3b8', margin: '0.5rem 0 0' }}>{t('app.noData')}</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  <FiUpload style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  {t('categories.uploadImage')}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImageFile}
                    disabled={uploading}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {uploading && (
                  <p style={{ color: '#3b82f6', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    {t('app.loading')}...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
