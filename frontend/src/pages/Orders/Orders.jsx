import { useState, useEffect } from 'react';
import { FiEye, FiX, FiCheck, FiTruck, FiPackage } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const Orders = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.page]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/test/orders', {
        params: { ...filters, page: pagination.page, limit: pagination.limit }
      });
      setOrders(res.data.data?.orders || []);
      setPagination(prev => ({ ...prev, total: res.data.data?.total || 0 }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/test/orders/${orderId}/status`, { status: newStatus });
      toast.success(t('orders.updateStatus'));
      fetchOrders();
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-info',
      shipped: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    return t(`orders.statuses.${status}`) || status;
  };

  const getPaymentStatusText = (status) => {
    return t(`orders.paymentStatuses.${status}`) || status;
  };

  const viewOrder = async (order) => {
    try {
      const res = await api.get(`/test/orders/${order.order_id}`);
      setSelectedOrder(res.data.data);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('orders.title')}</h1>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder={t('app.search')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">{t('app.all')} {t('app.status')}</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{getStatusText(status)}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('orders.orderNumber')}</th>
                <th>{t('orders.customer')}</th>
                <th>{t('orders.items')}</th>
                <th>{t('orders.total')}</th>
                <th>{t('orders.status')}</th>
                <th>{t('app.date')}</th>
                <th>{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">{t('orders.noOrders')}</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.order_id}>
                    <td><strong>#{order.order_id}</strong></td>
                    <td>
                      {order.customer_name || 'Guest'}
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.customer_phone}</div>
                    </td>
                    <td>{order.items_count || 0}</td>
                    <td><strong>₪{parseFloat(order.total_amount || 0).toFixed(2)}</strong></td>
                    <td>
                      <select
                        className={`badge ${getStatusBadge(order.status)}`}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{getStatusText(status)}</option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                    <td>
                      <button className="btn-icon view" onClick={() => viewOrder(order)}><FiEye /></button>
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

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{t('orders.orderDetails')} #{selectedOrder.order_id}</h3>
              <button className="btn-icon" onClick={() => setSelectedOrder(null)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('orders.customer')}</h4>
                  <p><strong>{t('adminUsers.fullName')}:</strong> {selectedOrder.customer_name || 'Guest'}</p>
                  <p><strong>{t('orders.phone')}:</strong> {selectedOrder.customer_phone || '-'}</p>
                  <p><strong>{t('orders.email')}:</strong> {selectedOrder.customer_email || '-'}</p>
                </div>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('orders.orderDetails')}</h4>
                  <p><strong>{t('orders.orderNumber')}:</strong> {selectedOrder.order_number}</p>
                  <p><strong>{t('orders.status')}:</strong> <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>{getStatusText(selectedOrder.status)}</span></p>
                  <p><strong>{t('app.date')}:</strong> {new Date(selectedOrder.created_at).toLocaleString('en-GB')}</p>
                  <p><strong>{t('orders.paymentMethod')}:</strong> {selectedOrder.payment_method?.replace('_', ' ') || 'Cash'}</p>
                  <p><strong>{t('orders.paymentStatus')}:</strong> <span className={`badge ${selectedOrder.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{getPaymentStatusText(selectedOrder.payment_status)}</span></p>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('orders.shippingAddress')}</h4>
                {selectedOrder.address ? (
                  <div>
                    <p><strong>{selectedOrder.address.full_name}</strong> - {selectedOrder.address.phone_number}</p>
                    <p>{selectedOrder.address.address_line1}</p>
                    {selectedOrder.address.address_line2 && <p>{selectedOrder.address.address_line2}</p>}
                    <p>{selectedOrder.address.city}{selectedOrder.address.state ? `, ${selectedOrder.address.state}` : ''} {selectedOrder.address.postal_code}</p>
                    <p>{selectedOrder.address.country}</p>
                  </div>
                ) : selectedOrder.shipping_address || selectedOrder.guest_address ? (
                  <div>
                    <p><strong>{selectedOrder.customer_name}</strong> - {selectedOrder.customer_phone}</p>
                    <p>{selectedOrder.shipping_address || selectedOrder.guest_address}</p>
                    {selectedOrder.delivery_region && (
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {selectedOrder.delivery_region === 'west_bank' ? 'الضفة الغربية' :
                         selectedOrder.delivery_region === 'jerusalem' ? 'القدس' : 'الداخل 48'}
                      </p>
                    )}
                  </div>
                ) : (
                  <p>{t('app.noData')}</p>
                )}
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('orders.items')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(selectedOrder.items || []).map((item, idx) => {
                    // Parse selected_options if it's a string
                    let selectedOptions = [];
                    try {
                      selectedOptions = typeof item.selected_options === 'string'
                        ? JSON.parse(item.selected_options)
                        : (item.selected_options || []);
                    } catch (e) {
                      selectedOptions = [];
                    }

                    const optionsTotal = selectedOptions.reduce((sum, opt) => sum + (parseFloat(opt.additional_price) || 0), 0);

                    return (
                      <div key={idx} style={{
                        background: '#f8fafc',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {/* Product Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: selectedOptions.length > 0 ? '10px' : '0' }}>
                          <div>
                            <strong style={{ fontSize: '1rem', color: '#1e293b' }}>
                              {item.product_name || item.product_name_en || 'Product'}
                            </strong>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                              {t('orders.items')}: {item.quantity} × ₪{parseFloat(item.unit_price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '1.1rem', color: '#c9a227' }}>
                              ₪{parseFloat(item.total_price || 0).toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* Selected Options */}
                        {selectedOptions.length > 0 && (
                          <div style={{
                            background: '#fff',
                            borderRadius: '6px',
                            padding: '10px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                              {t('orders.options') || 'Options'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {selectedOptions.map((opt, optIdx) => (
                                <div key={optIdx} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '6px 8px',
                                  background: '#f1f5f9',
                                  borderRadius: '4px'
                                }}>
                                  <span style={{ color: '#475569' }}>
                                    <span style={{ fontWeight: '500' }}>{opt.type_name}:</span> {opt.value_name}
                                  </span>
                                  {opt.additional_price > 0 ? (
                                    <span style={{
                                      color: '#22c55e',
                                      fontWeight: '600',
                                      background: '#dcfce7',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.85rem'
                                    }}>
                                      +₪{parseFloat(opt.additional_price).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>₪0.00</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {optionsTotal > 0 && (
                              <div style={{
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px dashed #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem'
                              }}>
                                <span style={{ color: '#64748b' }}>{t('orders.options') || 'Options'} {t('orders.total')}:</span>
                                <strong style={{ color: '#22c55e' }}>+₪{optionsTotal.toFixed(2)}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Order Totals */}
                <div style={{
                  marginTop: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>{t('orders.subtotal')}:</span>
                    <strong>₪{parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</strong>
                  </div>
                  {parseFloat(selectedOrder.shipping_cost) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                      <span>{t('orders.shipping')}:</span>
                      <span>₪{parseFloat(selectedOrder.shipping_cost).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(selectedOrder.tax_amount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                      <span>{t('orders.tax')}:</span>
                      <span>₪{parseFloat(selectedOrder.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(selectedOrder.discount_amount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>{t('orders.discount')}:</span>
                      <span style={{ color: '#22c55e' }}>-₪{parseFloat(selectedOrder.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '2px solid #e2e8f0',
                    fontSize: '1.1rem'
                  }}>
                    <strong>{t('orders.total')}:</strong>
                    <strong style={{ color: '#c9a227' }}>₪{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <select
                className="form-control"
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder.order_id, e.target.value)}
                style={{ width: 'auto' }}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{getStatusText(status)}</option>
                ))}
              </select>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>{t('app.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
