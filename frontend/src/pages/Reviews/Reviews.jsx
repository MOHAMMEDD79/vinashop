import { useState, useEffect } from 'react';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const Reviews = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', rating: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchReviews();
  }, [filters, pagination.page]);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/test/reviews', { params: { ...filters, page: pagination.page, limit: pagination.limit } });
      setReviews(res.data.data?.reviews || []);
      setPagination(prev => ({ ...prev, total: res.data.data?.total || 0 }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      await api.put(`/test/reviews/${reviewId}/status`, { status: newStatus });
      toast.success(t('app.success'));
      fetchReviews();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('reviews.deleteConfirm'))) return;
    try {
      await api.delete(`/test/reviews/${id}`);
      toast.success(t('app.success'));
      fetchReviews();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        style={{
          color: i < rating ? '#f59e0b' : '#e2e8f0',
          fill: i < rating ? '#f59e0b' : 'none'
        }}
      />
    ));
  };

  const getStatusBadge = (status) => {
    const badges = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
    return badges[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    return t(`reviews.statuses.${status}`) || status;
  };

  const statusOptions = ['pending', 'approved', 'rejected'];

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('reviews.title')}</h1>
      </div>

      <div className="filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">{t('app.all')} {t('app.status')}</option>
          <option value="pending">{t('reviews.statuses.pending')}</option>
          <option value="approved">{t('reviews.statuses.approved')}</option>
          <option value="rejected">{t('reviews.statuses.rejected')}</option>
        </select>
        <select value={filters.rating} onChange={(e) => setFilters({ ...filters, rating: e.target.value })}>
          <option value="">{t('reviews.allRatings')}</option>
          <option value="5">5 ★</option>
          <option value="4">4 ★</option>
          <option value="3">3 ★</option>
          <option value="2">2 ★</option>
          <option value="1">1 ★</option>
        </select>
      </div>

      <div className="card">
        {reviews.length === 0 ? (
          <div className="empty-state">
            <FiStar style={{ fontSize: '3rem', marginBottom: '15px' }} />
            <p>{t('reviews.noReviews')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('reviews.product')}</th>
                  <th>{t('reviews.customer')}</th>
                  <th>{t('reviews.rating')}</th>
                  <th>{t('reviews.review')}</th>
                  <th>{t('reviews.status')}</th>
                  <th>{t('reviews.date')}</th>
                  <th>{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review.review_id}>
                    <td>
                      <strong>{review.product_name || 'Product'}</strong>
                    </td>
                    <td>{review.customer_name || 'Customer'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {renderStars(review.rating)}
                      </div>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      {review.review_text?.length > 100
                        ? review.review_text.slice(0, 100) + '...'
                        : review.review_text || '-'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(review.status)}`}>
                        {getStatusText(review.status)}
                      </span>
                    </td>
                    <td>{new Date(review.created_at).toLocaleDateString('en-GB')}</td>
                    <td>
                      <div className="action-btns" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          className={`badge ${getStatusBadge(review.status)}`}
                          value={review.status}
                          onChange={(e) => handleStatusChange(review.review_id, e.target.value)}
                          style={{
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{getStatusText(status)}</option>
                          ))}
                        </select>
                        <button className="btn-icon delete" onClick={() => handleDelete(review.review_id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
    </div>
  );
};

export default Reviews;
