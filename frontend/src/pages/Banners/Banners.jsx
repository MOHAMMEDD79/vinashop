import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiImage, FiVideo, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { getMediaUrl as getMediaUrlUtil } from '../../utils/imageUrl';

const Banners = () => {
  const { t } = useLanguage();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title_en: '',
    title_ar: '',
    subtitle_en: '',
    subtitle_ar: '',
    media_type: 'image',
    link_type: 'none',
    link_value: '',
    display_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
    file: null
  });

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/test/banners');
      setBanners(res.data.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/test/categories');
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/test/products?limit=100');
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('title_en', form.title_en);
      formData.append('title_ar', form.title_ar);
      formData.append('subtitle_en', form.subtitle_en);
      formData.append('subtitle_ar', form.subtitle_ar);
      formData.append('media_type', form.media_type);
      formData.append('link_type', form.link_type);
      formData.append('link_value', form.link_value);
      formData.append('display_order', form.display_order);
      formData.append('is_active', form.is_active ? 1 : 0);
      formData.append('start_date', form.start_date || '');
      formData.append('end_date', form.end_date || '');

      if (form.file) {
        formData.append('media', form.file);
      }

      if (editingBanner) {
        await api.put(`/test/banners/${editingBanner.banner_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('app.success'));
      } else {
        await api.post('/test/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('app.success'));
      }

      setShowModal(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('banners.deleteConfirm'))) return;
    try {
      await api.delete(`/test/banners/${id}`);
      toast.success(t('app.success'));
      fetchBanners();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleOrderChange = async (bannerId, direction) => {
    const banner = banners.find(b => b.banner_id === bannerId);
    if (!banner) return;

    const newOrder = direction === 'up'
      ? Math.max(0, banner.display_order - 1)
      : banner.display_order + 1;

    try {
      await api.patch(`/test/banners/${bannerId}/order`, { display_order: newOrder });
      fetchBanners();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await api.patch(`/test/banners/${banner.banner_id}/status`, {
        is_active: !banner.is_active
      });
      fetchBanners();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setForm({
      title_en: banner.title_en || '',
      title_ar: banner.title_ar || '',
      subtitle_en: banner.subtitle_en || '',
      subtitle_ar: banner.subtitle_ar || '',
      media_type: banner.media_type || 'image',
      link_type: banner.link_type || 'none',
      link_value: banner.link_value || '',
      display_order: banner.display_order || 0,
      is_active: banner.is_active === 1 || banner.is_active === true,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
      file: null
    });
    setMediaPreview(getMediaUrl(banner));
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setMediaPreview(null);
    setForm({
      title_en: '',
      title_ar: '',
      subtitle_en: '',
      subtitle_ar: '',
      media_type: 'image',
      link_type: 'none',
      link_value: '',
      display_order: banners.length,
      is_active: true,
      start_date: '',
      end_date: '',
      file: null
    });
  };

  const getMediaUrl = (banner) => {
    // Banner media is stored as file path in uploads folder
    if (banner.media_path) {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://api-v2.vinashop.ps';
      return `${API_BASE}/${banner.media_path}`;
    }
    return null;
  };

  const getOrderLabel = (order) => {
    if (order === 0) return t('banners.primary');
    return `${t('banners.secondary')} ${order}`;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('banners.title')}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <FiPlus /> {t('banners.addBanner')}
        </button>
      </div>

      <div className="card">
        {banners.length === 0 ? (
          <div className="empty-state">
            <FiImage style={{ fontSize: '3rem', marginBottom: '15px' }} />
            <p>{t('banners.noBanners')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {banners.sort((a, b) => a.display_order - b.display_order).map(banner => (
              <div key={banner.banner_id} style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                overflow: 'hidden',
                background: 'white'
              }}>
                <div style={{
                  height: '180px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {banner.media_type === 'video' ? (
                    getMediaUrl(banner) ? (
                      <video src={getMediaUrl(banner)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <FiVideo style={{ fontSize: '3rem', color: '#94a3b8' }} />
                    )
                  ) : (
                    getMediaUrl(banner) ? (
                      <img src={getMediaUrl(banner)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <FiImage style={{ fontSize: '3rem', color: '#94a3b8' }} />
                    )
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    display: 'flex',
                    gap: '5px'
                  }}>
                    <span className={`badge ${banner.display_order === 0 ? 'badge-success' : 'badge-info'}`}>
                      {getOrderLabel(banner.display_order)}
                    </span>
                    <span className={`badge ${banner.media_type === 'video' ? 'badge-warning' : 'badge-secondary'}`}>
                      {banner.media_type === 'video' ? <FiVideo /> : <FiImage />}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>
                    {banner.title_en || 'Untitled'}
                  </h3>
                  {banner.subtitle_en && (
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b' }}>
                      {banner.subtitle_en.length > 50 ? banner.subtitle_en.slice(0, 50) + '...' : banner.subtitle_en}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span
                      className={`badge ${banner.is_active ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleToggleActive(banner)}
                    >
                      {banner.is_active ? t('app.active') : t('app.inactive')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {banner.link_type !== 'none' && t(`banners.linkTypes.${banner.link_type}`)}
                    </span>
                  </div>
                  <div className="action-btns" style={{ display: 'flex', gap: '5px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleOrderChange(banner.banner_id, 'up')}
                        disabled={banner.display_order === 0}
                        style={{ opacity: banner.display_order === 0 ? 0.5 : 1 }}
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleOrderChange(banner.banner_id, 'down')}
                      >
                        <FiArrowDown />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-icon edit" onClick={() => openEditModal(banner)}><FiEdit2 /></button>
                      <button className="btn-icon delete" onClick={() => handleDelete(banner.banner_id)}><FiTrash2 /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>{editingBanner ? t('banners.editBanner') : t('banners.addBanner')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Media Upload Section */}
                <div className="form-group">
                  <label>{t('banners.mediaType')}</label>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="media_type"
                        value="image"
                        checked={form.media_type === 'image'}
                        onChange={(e) => setForm({ ...form, media_type: e.target.value })}
                        style={{ marginRight: '5px' }}
                      />
                      <FiImage style={{ marginRight: '5px' }} /> {t('banners.image')}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="media_type"
                        value="video"
                        checked={form.media_type === 'video'}
                        onChange={(e) => setForm({ ...form, media_type: e.target.value })}
                        style={{ marginRight: '5px' }}
                      />
                      <FiVideo style={{ marginRight: '5px' }} /> {t('banners.video')}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('banners.uploadMedia')}</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept={form.media_type === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: '10px',
                      padding: '30px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: '#f8fafc',
                      minHeight: '150px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {mediaPreview ? (
                      form.media_type === 'video' ? (
                        <video src={mediaPreview} style={{ maxWidth: '100%', maxHeight: '200px' }} controls />
                      ) : (
                        <img src={mediaPreview} alt="" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                      )
                    ) : (
                      <>
                        <FiUpload style={{ fontSize: '2rem', color: '#64748b', marginBottom: '10px' }} />
                        <p style={{ color: '#64748b' }}>{t('billImages.clickToSelect')}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Titles */}
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('banners.titleEn')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('banners.titleAr')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.title_ar}
                      onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Subtitles */}
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('banners.subtitleEn')}</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={form.subtitle_en}
                      onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('banners.subtitleAr')}</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={form.subtitle_ar}
                      onChange={(e) => setForm({ ...form, subtitle_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Link Settings */}
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('banners.linkType')}</label>
                    <select
                      className="form-control"
                      value={form.link_type}
                      onChange={(e) => setForm({ ...form, link_type: e.target.value, link_value: '' })}
                    >
                      <option value="none">{t('banners.linkTypes.none')}</option>
                      <option value="category">{t('banners.linkTypes.category')}</option>
                      <option value="product">{t('banners.linkTypes.product')}</option>
                      <option value="url">{t('banners.linkTypes.url')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('banners.linkValue')}</label>
                    {form.link_type === 'category' ? (
                      <select
                        className="form-control"
                        value={form.link_value}
                        onChange={(e) => setForm({ ...form, link_value: e.target.value })}
                      >
                        <option value="">{t('banners.selectCategory')}</option>
                        {categories.map(cat => (
                          <option key={cat.category_id} value={cat.category_id}>{cat.name_en}</option>
                        ))}
                      </select>
                    ) : form.link_type === 'product' ? (
                      <select
                        className="form-control"
                        value={form.link_value}
                        onChange={(e) => setForm({ ...form, link_value: e.target.value })}
                      >
                        <option value="">{t('banners.selectProduct')}</option>
                        {products.map(prod => (
                          <option key={prod.product_id} value={prod.product_id}>{prod.name_en}</option>
                        ))}
                      </select>
                    ) : form.link_type === 'url' ? (
                      <input
                        type="url"
                        className="form-control"
                        value={form.link_value}
                        onChange={(e) => setForm({ ...form, link_value: e.target.value })}
                        placeholder={t('banners.enterUrl')}
                      />
                    ) : (
                      <input type="text" className="form-control" disabled placeholder="-" />
                    )}
                  </div>
                </div>

                {/* Order and Status */}
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('banners.displayOrder')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.display_order}
                      onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                    <small style={{ color: '#64748b' }}>{t('banners.orderHint')}</small>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '1.5rem' }}>
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {t('app.active')}
                    </label>
                  </div>
                </div>

                {/* Scheduling */}
                <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem', color: '#64748b' }}>{t('banners.scheduling')}</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('banners.startDate')}</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('banners.endDate')}</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingBanner ? t('app.save') : t('app.add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banners;
