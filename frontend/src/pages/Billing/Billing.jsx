import { useState, useEffect } from 'react';
import { FiEye, FiX, FiCheck, FiFileText } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const Billing = () => {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchInvoices();
  }, [filters, pagination.page]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/test/invoices', { params: { ...filters, page: pagination.page, limit: pagination.limit } });
      setInvoices(res.data.data?.invoices || []);
      setPagination(prev => ({ ...prev, total: res.data.data?.total || 0 }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error(t('billing.noInvoices'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (invoice) => {
    try {
      await api.put(`/test/invoices/${invoice.invoice_id}/paid`);
      toast.success(t('billing.markAsPaid'));
      fetchInvoices();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const viewInvoice = async (invoice) => {
    try {
      const res = await api.get(`/test/invoices/${invoice.invoice_id}`);
      setSelectedInvoice(res.data.data);
      setShowModal(true);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = { pending: 'badge-warning', paid: 'badge-success', cancelled: 'badge-danger' };
    return badges[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    return t(`billing.statuses.${status}`) || status;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('billing.title')}</h1>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder={t('billing.searchInvoices')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">{t('billing.allStatus')}</option>
          <option value="pending">{t('billing.statuses.pending')}</option>
          <option value="paid">{t('billing.statuses.paid')}</option>
          <option value="cancelled">{t('billing.statuses.cancelled')}</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('billing.invoiceNumber')}</th>
                <th>{t('billing.order')}</th>
                <th>{t('billing.customer')}</th>
                <th>{t('billing.amount')}</th>
                <th>{t('billing.status')}</th>
                <th>{t('billing.date')}</th>
                <th>{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">{t('billing.noInvoices')}</td></tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice.invoice_id}>
                    <td><strong>{invoice.invoice_number}</strong></td>
                    <td>#{invoice.order_id}</td>
                    <td>{invoice.customer_name}</td>
                    <td>
                      <strong>₪{parseFloat(invoice.total_amount || 0).toFixed(2)}</strong>
                      {parseFloat(invoice.tax_amount) > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {t('orders.tax')}: ₪{parseFloat(invoice.tax_amount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td>{new Date(invoice.created_at).toLocaleDateString('en-GB')}</td>
                    <td>
                      <div className="action-btns">
                        {invoice.status === 'pending' && (
                          <button className="btn-icon" onClick={() => handleMarkPaid(invoice)} title={t('billing.markAsPaid')} style={{ color: '#22c55e' }}>
                            <FiCheck />
                          </button>
                        )}
                        <button className="btn-icon view" onClick={() => viewInvoice(invoice)} title={t('billing.invoiceDetails')}>
                          <FiEye />
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

      {showModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3><FiFileText style={{ marginRight: '8px' }} /> {selectedInvoice.invoice_number}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('billing.customer')}</h4>
                  <p><strong>{selectedInvoice.customer_name}</strong></p>
                  <p>{selectedInvoice.customer_email}</p>
                  {selectedInvoice.customer_phone && <p>{selectedInvoice.customer_phone}</p>}
                </div>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('billing.invoiceDetails')}</h4>
                  <p><strong>{t('billing.order')}:</strong> #{selectedInvoice.order_id}</p>
                  <p><strong>{t('billing.status')}:</strong> <span className={`badge ${getStatusBadge(selectedInvoice.status)}`}>{getStatusText(selectedInvoice.status)}</span></p>
                  <p><strong>{t('billing.date')}:</strong> {new Date(selectedInvoice.created_at).toLocaleDateString('en-GB')}</p>
                  <p><strong>{t('orders.paymentMethod')}:</strong> {selectedInvoice.payment_method?.replace('_', ' ')}</p>
                </div>
              </div>

              {selectedInvoice.address && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('billing.billingAddress')}</h4>
                  <p>{selectedInvoice.address.address_line1}</p>
                  {selectedInvoice.address.address_line2 && <p>{selectedInvoice.address.address_line2}</p>}
                  <p>{selectedInvoice.address.city}{selectedInvoice.address.state ? `, ${selectedInvoice.address.state}` : ''}</p>
                </div>
              )}

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('orders.items')}</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>{t('reviews.product')}</th>
                        <th>{t('products.price')}</th>
                        <th>{t('orders.items')}</th>
                        <th>{t('orders.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.product_name || item.product_name_en}</td>
                          <td>₪{parseFloat(item.unit_price).toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td>₪{parseFloat(item.total_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{t('orders.subtotal')}:</span>
                  <span>₪{parseFloat(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                </div>
                {parseFloat(selectedInvoice.shipping_cost) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>{t('orders.shipping')}:</span>
                    <span>₪{parseFloat(selectedInvoice.shipping_cost).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(selectedInvoice.tax_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>{t('orders.tax')}:</span>
                    <span>₪{parseFloat(selectedInvoice.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(selectedInvoice.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#22c55e' }}>
                    <span>{t('orders.discount')}:</span>
                    <span>-₪{parseFloat(selectedInvoice.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px' }}>
                  <span>{t('orders.total')}:</span>
                  <span>₪{parseFloat(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedInvoice.status === 'pending' && (
                <button className="btn btn-primary" onClick={() => { handleMarkPaid(selectedInvoice); setShowModal(false); }}>
                  <FiCheck /> {t('billing.markAsPaid')}
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
