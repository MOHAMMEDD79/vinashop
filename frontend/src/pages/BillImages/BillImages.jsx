import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash2, FiEye, FiX, FiCheck, FiUpload } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { getImageUrl } from '../../utils/imageUrl';

const BillImages = () => {
  const { t } = useLanguage();
  const [billImages, setBillImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filters, setFilters] = useState({ bill_type: '', is_processed: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });
  const [uploadData, setUploadData] = useState({ bill_type: 'purchase', description: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBillImages();
  }, [filters, pagination.page]);

  const fetchBillImages = async () => {
    try {
      const res = await api.get('/test/bill-images', { params: { ...filters, page: pagination.page, limit: pagination.limit } });
      setBillImages(res.data.data?.billImages || []);
      setPagination(prev => ({ ...prev, total: res.data.data?.total || 0 }));
    } catch (error) {
      console.error('Error fetching bill images:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error(t('billImages.selectImages'));
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('bill_type', uploadData.bill_type);
      formData.append('description', uploadData.description);

      await api.post('/test/bill-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('app.success'));
      setShowUploadModal(false);
      setUploadData({ bill_type: 'purchase', description: '' });
      setSelectedFiles([]);
      setFilePreviews([]);
      fetchBillImages();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleMarkProcessed = async (billImage) => {
    try {
      await api.patch(`/test/bill-images/${billImage.bill_image_id}/processed`, {
        is_processed: !billImage.is_processed
      });
      toast.success(billImage.is_processed ? t('billImages.markUnprocessed') : t('billImages.markProcessed'));
      fetchBillImages();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('billImages.deleteConfirm'))) return;
    try {
      await api.delete(`/test/bill-images/${id}`);
      toast.success(t('app.success'));
      fetchBillImages();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const getBillTypeBadge = (type) => {
    const badges = {
      purchase: 'badge-info',
      expense: 'badge-warning',
      receipt: 'badge-success',
      other: 'badge-secondary'
    };
    return badges[type] || 'badge-secondary';
  };

  const getBillTypeText = (type) => {
    return t(`billImages.types.${type}`) || type;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('billImages.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <FiUpload /> {t('billImages.uploadBills')}
        </button>
      </div>

      <div className="filters">
        <select value={filters.bill_type} onChange={(e) => setFilters({ ...filters, bill_type: e.target.value })}>
          <option value="">{t('billImages.allTypes')}</option>
          <option value="purchase">{t('billImages.types.purchase')}</option>
          <option value="expense">{t('billImages.types.expense')}</option>
          <option value="receipt">{t('billImages.types.receipt')}</option>
          <option value="other">{t('billImages.types.other')}</option>
        </select>
        <select value={filters.is_processed} onChange={(e) => setFilters({ ...filters, is_processed: e.target.value })}>
          <option value="">{t('billImages.allStatus')}</option>
          <option value="true">{t('billImages.processed')}</option>
          <option value="false">{t('billImages.pending')}</option>
        </select>
      </div>

      <div className="card">
        {billImages.length === 0 ? (
          <div className="empty-state">
            <FiUpload style={{ fontSize: '3rem', marginBottom: '15px' }} />
            <p>{t('billImages.noBillImages')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {billImages.map(bill => (
              <div key={bill.bill_image_id} style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                overflow: 'hidden',
                background: 'white'
              }}>
                <div
                  style={{
                    height: '150px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setSelectedImage(bill); setShowViewModal(true); }}
                >
                  {bill.image_url ? (
                    <img src={getImageUrl(bill.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FiUpload style={{ fontSize: '2rem', color: '#94a3b8' }} />
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={`badge ${getBillTypeBadge(bill.bill_type)}`}>
                      {getBillTypeText(bill.bill_type)}
                    </span>
                    <span className={`badge ${bill.is_processed ? 'badge-success' : 'badge-warning'}`}>
                      {bill.is_processed ? t('billImages.processed') : t('billImages.pending')}
                    </span>
                  </div>
                  {bill.description && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                      {bill.description.length > 50 ? bill.description.slice(0, 50) + '...' : bill.description}
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>
                    {new Date(bill.created_at).toLocaleDateString('en-GB')}
                  </div>
                  <div className="action-btns">
                    <button
                      className="btn-icon view"
                      onClick={() => handleMarkProcessed(bill)}
                      title={bill.is_processed ? t('billImages.markUnprocessed') : t('billImages.markProcessed')}
                    >
                      <FiCheck />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDelete(bill.bill_image_id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.total > pagination.limit && (
          <div className="pagination" style={{ marginTop: '20px' }}>
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

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('billImages.uploadBills')}</h3>
              <button className="btn-icon" onClick={() => setShowUploadModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('billImages.billType')}</label>
                  <select className="form-control" value={uploadData.bill_type}
                    onChange={(e) => setUploadData({ ...uploadData, bill_type: e.target.value })}>
                    <option value="purchase">{t('billImages.types.purchase')}</option>
                    <option value="expense">{t('billImages.types.expense')}</option>
                    <option value="receipt">{t('billImages.types.receipt')}</option>
                    <option value="other">{t('billImages.types.other')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('billImages.description')}</label>
                  <textarea className="form-control" rows="3" value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder={t('billImages.description') + '...'} />
                </div>
                <div className="form-group">
                  <label>{t('billImages.selectImages')} *</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #e5e7eb',
                      borderRadius: '8px',
                      padding: '2rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: '#f9fafb'
                    }}
                  >
                    <FiUpload size={32} color="#94a3b8" />
                    <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>
                      {t('app.clickToUpload')}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {filePreviews.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                      gap: '0.5rem',
                      marginTop: '1rem'
                    }}>
                      {filePreviews.map((preview, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <img
                            src={preview}
                            alt=""
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #e5e7eb'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)} disabled={uploading}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={uploading || selectedFiles.length === 0}>
                  {uploading ? t('app.loading') + '...' : t('billImages.uploadBills')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedImage && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>{t('billImages.title')}</h3>
              <button className="btn-icon" onClick={() => setShowViewModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <img
                src={getImageUrl(selectedImage.image_url)}
                alt=""
                style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
              />
              <div style={{ marginTop: '20px' }}>
                <p><strong>{t('billImages.billType')}:</strong> <span className={`badge ${getBillTypeBadge(selectedImage.bill_type)}`}>{getBillTypeText(selectedImage.bill_type)}</span></p>
                <p><strong>{t('app.status')}:</strong> <span className={`badge ${selectedImage.is_processed ? 'badge-success' : 'badge-warning'}`}>{selectedImage.is_processed ? t('billImages.processed') : t('billImages.pending')}</span></p>
                {selectedImage.description && <p><strong>{t('billImages.description')}:</strong> {selectedImage.description}</p>}
                <p><strong>{t('app.date')}:</strong> {new Date(selectedImage.created_at).toLocaleString('en-GB')}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>{t('app.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillImages;
