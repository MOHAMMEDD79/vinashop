import { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiDollarSign, FiX, FiAlertTriangle, FiUser, FiClock } from 'react-icons/fi';
import { customerDebtsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

// Helper function to format date properly (DD/MM/YYYY)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const CustomerDebts = () => {
  const { t } = useLanguage();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [customerSummary, setCustomerSummary] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [statistics, setStatistics] = useState(null);
  const [overdueDebts, setOverdueDebts] = useState([]);

  // For creating debts
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    total_debt: 0,
    due_date: '',
    notes: ''
  });

  // For payment
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchDebts();
    fetchStatistics();
    fetchOverdueDebts();
  }, [filters, pagination.page]);

  const fetchDebts = async () => {
    try {
      const res = await customerDebtsAPI.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setDebts(res.data.data || []);
      setPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching debts:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await customerDebtsAPI.getStatistics();
      setStatistics(res.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchOverdueDebts = async () => {
    try {
      const res = await customerDebtsAPI.getOverdue({ limit: 5 });
      setOverdueDebts(res.data.data || []);
    } catch (error) {
      console.error('Error fetching overdue debts:', error);
    }
  };

  const fetchCustomerSummary = async (userId) => {
    try {
      const res = await customerDebtsAPI.getUserSummary(userId);
      setCustomerSummary(res.data.data);
      setShowCustomerModal(true);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name) {
      toast.error('Please enter customer name');
      return;
    }
    if (!formData.total_debt || formData.total_debt <= 0) {
      toast.error('Please enter a valid debt amount');
      return;
    }

    try {
      const submitData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || '',
        total_debt: formData.total_debt,
        due_date: formData.due_date || null,
        notes: formData.notes || ''
      };
      await customerDebtsAPI.create(submitData);
      toast.success('Debt created successfully');
      setShowModal(false);
      resetForm();
      fetchDebts();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await customerDebtsAPI.recordPayment(selectedDebt.id || selectedDebt.debtId, paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({ amount: 0, payment_method: 'cash', notes: '' });
      fetchDebts();
      fetchStatistics();
      if (showViewModal) {
        viewDebt(selectedDebt);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const viewDebt = async (debt) => {
    try {
      const res = await customerDebtsAPI.getById(debt.id || debt.debtId);
      setSelectedDebt(res.data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const openPaymentModal = (debt) => {
    setSelectedDebt(debt);
    setPaymentData({
      amount: parseFloat(debt.remainingDebt || debt.remaining_debt) || 0,
      payment_method: 'cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      total_debt: 0,
      due_date: '',
      notes: ''
    });
    setSelectedDebt(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-danger',
      partial: 'badge-warning',
      settled: 'badge-success'
    };
    return badges[status] || 'badge-secondary';
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('customerDebts.title') || 'Customer Debts'}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <FiPlus /> {t('customerDebts.createDebt')}
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#3b82f6' }}>
              {statistics.totalDebts || statistics.total_debts || 0}
            </div>
            <div style={{ color: '#64748b' }}>{t('customerDebts.title')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>
              ₪{parseFloat(statistics.totalDebtAmount || statistics.total_debt_amount || statistics.total_amount || 0).toFixed(2)}
            </div>
            <div style={{ color: '#64748b' }}>{t('customerDebts.totalDebt')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#22c55e' }}>
              ₪{parseFloat(statistics.totalPaid || statistics.total_paid || 0).toFixed(2)}
            </div>
            <div style={{ color: '#64748b' }}>{t('app.paid')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>
              ₪{parseFloat(statistics.totalRemaining || statistics.total_remaining || statistics.remaining || 0).toFixed(2)}
            </div>
            <div style={{ color: '#64748b' }}>{t('customerDebts.remainingDebt')}</div>
          </div>
        </div>
      )}

      {/* Overdue Alert */}
      {overdueDebts.length > 0 && (
        <div className="card" style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          marginBottom: '20px',
          padding: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <FiAlertTriangle style={{ color: '#ef4444', fontSize: '1.5em' }} />
            <strong style={{ color: '#ef4444' }}>{t('customerDebts.overdueDebts')} ({overdueDebts.length})</strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {overdueDebts.slice(0, 5).map(debt => (
              <div
                key={debt.debtId || debt.debt_id}
                style={{
                  background: 'white',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  cursor: 'pointer'
                }}
                onClick={() => viewDebt(debt)}
              >
                <strong>{debt.customerName || debt.customer_name}</strong>
                <div style={{ color: '#ef4444' }}>₪{parseFloat(debt.remainingDebt || debt.remaining_debt || 0).toFixed(2)}</div>
                <div style={{ fontSize: '0.8em', color: '#64748b' }}>
                  {t('customerDebts.dueDate')}: {formatDate(debt.dueDate || debt.due_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filters">
        <input
          type="text"
          placeholder={t('app.search')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">{t('app.all')} {t('app.status')}</option>
          <option value="pending">{t('customerDebts.statuses.pending')}</option>
          <option value="partial">{t('customerDebts.statuses.partial')}</option>
          <option value="settled">{t('customerDebts.statuses.settled')}</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('customerDebts.customer')}</th>
                <th>{t('customerDebts.totalDebt')}</th>
                <th>{t('app.paid')}</th>
                <th>{t('customerDebts.remainingDebt')}</th>
                <th>{t('customerDebts.dueDate')}</th>
                <th>{t('app.status')}</th>
                <th>{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">{t('customerDebts.noDebts')}</td></tr>
              ) : (
                debts.map(debt => (
                  <tr
                    key={debt.id || debt.debtId}
                    style={{
                      background: isOverdue(debt.dueDate || debt.due_date) && (debt.status !== 'settled')
                        ? '#fef2f2' : undefined
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => fetchCustomerSummary(debt.userId || debt.user_id)}
                        >
                          <FiUser />
                        </div>
                        <div>
                          <strong>{debt.customerName || debt.customer_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {debt.customerPhone || debt.customer_phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><strong>₪{parseFloat(debt.totalDebt || debt.total_debt || 0).toFixed(2)}</strong></td>
                    <td style={{ color: '#22c55e' }}>₪{parseFloat(debt.amountPaid || debt.amount_paid || 0).toFixed(2)}</td>
                    <td style={{ color: '#ef4444', fontWeight: 'bold' }}>
                      ₪{parseFloat(debt.remainingDebt || debt.remaining_debt || 0).toFixed(2)}
                    </td>
                    <td>
                      {(debt.dueDate || debt.due_date) ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: isOverdue(debt.dueDate || debt.due_date) && debt.status !== 'settled' ? '#ef4444' : undefined
                        }}>
                          {isOverdue(debt.dueDate || debt.due_date) && debt.status !== 'settled' && <FiClock />}
                          {formatDate(debt.dueDate || debt.due_date)}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(debt.status)}`}>
                        {(debt.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon view" onClick={() => viewDebt(debt)} title="View">
                          <FiEye />
                        </button>
                        {debt.status !== 'settled' && (
                          <button
                            className="btn-icon"
                            onClick={() => openPaymentModal(debt)}
                            title="Record Payment"
                            style={{ color: '#22c55e' }}
                          >
                            <FiDollarSign />
                          </button>
                        )}
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

      {/* Create Debt Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('customerDebts.createDebt')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('customerDebts.customerName') || 'Customer Name'} *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('customerDebts.enterCustomerName') || 'Enter customer name...'}
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('customerDebts.customerPhone') || 'Phone Number'}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('customerDebts.enterPhone') || 'Enter phone number...'}
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('customerDebts.totalDebt')} *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.total_debt}
                    min="0.01"
                    step="0.01"
                    onChange={(e) => setFormData({ ...formData, total_debt: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('customerDebts.dueDate')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('customerDebts.notes')}</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('app.optional') + '...'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('customerDebts.createDebt')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Debt Modal */}
      {showViewModal && selectedDebt && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{t('customerDebts.viewDetails')}</h3>
              <button className="btn-icon" onClick={() => setShowViewModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('customerDebts.customer')}</h4>
                  <p><strong>{selectedDebt.customerName || selectedDebt.customer_name}</strong></p>
                  <p>{selectedDebt.customerPhone || selectedDebt.customer_phone}</p>
                  <p>{selectedDebt.customerEmail || selectedDebt.customer_email}</p>
                </div>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('customerDebts.title')}</h4>
                  <p><strong>{t('app.status')}:</strong> <span className={`badge ${getStatusBadge(selectedDebt.status)}`}>{t('customerDebts.statuses.' + (selectedDebt.status || 'pending'))}</span></p>
                  {(selectedDebt.dueDate || selectedDebt.due_date) && (
                    <p><strong>{t('customerDebts.dueDate')}:</strong> {formatDate(selectedDebt.dueDate || selectedDebt.due_date)}</p>
                  )}
                  <p><strong>{t('customerDebts.createdAt')}:</strong> {formatDate(selectedDebt.createdAt || selectedDebt.created_at)}</p>
                </div>
              </div>

              <div style={{
                background: '#f1f5f9',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>{t('customerDebts.totalDebt')}:</span>
                  <strong>₪{parseFloat(selectedDebt.totalDebt || selectedDebt.total_debt || 0).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>{t('customerDebts.amountPaid')}:</span>
                  <span style={{ color: '#22c55e' }}>₪{parseFloat(selectedDebt.amountPaid || selectedDebt.amount_paid || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <strong>{t('customerDebts.remainingDebt')}:</strong>
                  <strong style={{ color: '#ef4444', fontSize: '1.2em' }}>
                    ₪{parseFloat(selectedDebt.remainingDebt || selectedDebt.remaining_debt || 0).toFixed(2)}
                  </strong>
                </div>
              </div>

              {selectedDebt.notes && (
                <p><strong>{t('customerDebts.notes')}:</strong> {selectedDebt.notes}</p>
              )}

              {/* Payment History */}
              {selectedDebt.payments && selectedDebt.payments.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('customerDebts.paymentHistory')}</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>{t('app.date')}</th>
                        <th>{t('app.amount')}</th>
                        <th>{t('customerDebts.paymentMethod')}</th>
                        <th>{t('customerDebts.notes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDebt.payments.map((payment, idx) => (
                        <tr key={idx}>
                          <td>{formatDate(payment.paymentDate || payment.payment_date)}</td>
                          <td style={{ color: '#22c55e' }}>₪{parseFloat(payment.amount).toFixed(2)}</td>
                          <td>{(payment.paymentMethod || payment.payment_method || '').replace('_', ' ')}</td>
                          <td>{payment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>{t('app.close')}</button>
              {selectedDebt.status !== 'settled' && (
                <button className="btn btn-primary" onClick={() => { setShowViewModal(false); openPaymentModal(selectedDebt); }}>
                  <FiDollarSign /> {t('customerDebts.recordPayment')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('customerDebts.recordPayment')}</h3>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div style={{
                  background: '#f1f5f9',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p><strong>{t('customerDebts.customer')}:</strong> {selectedDebt.customerName || selectedDebt.customer_name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <span>{t('customerDebts.remainingDebt')}:</span>
                    <strong style={{ color: '#ef4444' }}>
                      ₪{parseFloat(selectedDebt.remainingDebt || selectedDebt.remaining_debt || 0).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('customerDebts.paymentAmount')} *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentData.amount}
                    min="0.01"
                    step="0.01"
                    max={parseFloat(selectedDebt.remainingDebt || selectedDebt.remaining_debt || 0)}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('customerDebts.paymentMethod')}</label>
                  <select
                    className="form-control"
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  >
                    <option value="cash">{t('customerDebts.paymentMethods.cash')}</option>
                    <option value="card">{t('customerDebts.paymentMethods.card')}</option>
                    <option value="bank_transfer">{t('customerDebts.paymentMethods.bank_transfer')}</option>
                    <option value="other">{t('customerDebts.paymentMethods.other')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('customerDebts.notes')}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder={t('app.optional') + '...'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('customerDebts.recordPayment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Summary Modal */}
      {showCustomerModal && customerSummary && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{t('customerDebts.customerSummary')}</h3>
              <button className="btn-icon" onClick={() => setShowCustomerModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  fontSize: '1.5em'
                }}>
                  <FiUser />
                </div>
                <h3 style={{ margin: 0 }}>{customerSummary.customerName}</h3>
                <p style={{ color: '#64748b', margin: '5px 0' }}>{customerSummary.customerPhone}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '15px', background: '#f1f5f9', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{customerSummary.totalDebts || 0}</div>
                  <div style={{ fontSize: '0.9em', color: '#64748b' }}>{t('customerDebts.title')}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '15px', background: '#fef2f2', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ef4444' }}>
                    ₪{parseFloat(customerSummary.totalDebtAmount || 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#64748b' }}>{t('customerDebts.totalDebt')}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '15px', background: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#22c55e' }}>
                    ₪{parseFloat(customerSummary.totalPaid || 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#64748b' }}>{t('app.paid')}</div>
                </div>
              </div>

              <div style={{
                background: '#fef2f2',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.9em', color: '#64748b' }}>{t('customerDebts.remainingDebt')}</div>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>
                  ₪{parseFloat(customerSummary.totalRemaining || 0).toFixed(2)}
                </div>
              </div>

              {customerSummary.overdueCount > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '15px',
                  color: '#ef4444'
                }}>
                  <FiAlertTriangle />
                  <span>{customerSummary.overdueCount} {t('customerDebts.overdue')}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCustomerModal(false)}>{t('app.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDebts;
