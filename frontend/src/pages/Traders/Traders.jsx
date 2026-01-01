import { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiX, FiDollarSign, FiFileText, FiImage } from 'react-icons/fi';
import { tradersAPI, productsAPI, testAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { getImageUrl } from '../../utils/imageUrl';

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

const Traders = () => {
  const { t } = useLanguage();
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('traders');
  const [showModal, setShowModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewBillModal, setShowViewBillModal] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [statistics, setStatistics] = useState(null);

  // Trader bills
  const [traderBills, setTraderBills] = useState([]);
  const [billsPagination, setBillsPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Products for bill items
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    payment_terms: 30,
    credit_limit: 0,
    status: 'active',
    notes: ''
  });

  const [billFormData, setBillFormData] = useState({
    bill_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_amount: 0,
    notes: '',
    bill_image: '',
    items: []
  });

  const [paymentData, setPaymentData] = useState({
    bill_id: '',
    amount: 0,
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchTraders();
    fetchStatistics();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (showBillModal) {
      fetchProducts();
    }
  }, [showBillModal]);

  const fetchTraders = async () => {
    try {
      const res = await tradersAPI.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setTraders(res.data.data || []);
      setPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching traders:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await tradersAPI.getStatistics();
      setStatistics(res.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchTraderBills = async (traderId) => {
    try {
      const res = await tradersAPI.getBills(traderId, {
        page: billsPagination.page,
        limit: billsPagination.limit
      });
      setTraderBills(res.data.data || []);
      setBillsPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      // Try test API first to avoid auth issues
      const res = await testAPI.getProducts({ limit: 100 });
      const productsData = res.data?.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products from test API:', error);
      // Fallback to regular API
      try {
        const res = await productsAPI.getAll({ limit: 100, status: 'active' });
        const productsData = res.data?.data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (e) {
        console.error('Fallback products API also failed:', e);
        setProducts([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name) {
      toast.error('Company name is required');
      return;
    }

    try {
      if (editMode && selectedTrader) {
        await tradersAPI.update(selectedTrader.id || selectedTrader.traderId, formData);
        toast.success('Trader updated successfully');
      } else {
        await tradersAPI.create(formData);
        toast.success('Trader created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchTraders();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (billFormData.items.length === 0) {
      toast.error(t('traders.addAtLeastOneItem') || 'Please add at least one item');
      return;
    }

    // Calculate totals
    const subtotal = billFormData.items.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
    const totalAmount = subtotal + (parseFloat(billFormData.tax_amount) || 0);

    const submitData = {
      bill_number: billFormData.bill_number || generateBillNumber(),
      bill_date: billFormData.bill_date || new Date().toISOString().split('T')[0],
      due_date: billFormData.due_date || null,
      subtotal: subtotal,
      tax_amount: parseFloat(billFormData.tax_amount) || 0,
      total_amount: totalAmount,
      bill_image: billFormData.bill_image || '',
      notes: billFormData.notes || '',
      items: billFormData.items.map(item => ({
        product_id: item.product_id || null,
        description: item.description || 'Item',
        quantity: parseInt(item.quantity) || 1,
        unit_cost: parseFloat(item.unit_cost) || 0,
        total_cost: parseFloat(item.total_cost) || 0
      }))
    };

    try {
      await tradersAPI.createBill(selectedTrader.id || selectedTrader.traderId, submitData);
      toast.success(t('traders.billCreated') || 'Bill created successfully');
      setShowBillModal(false);
      resetBillForm();
      fetchTraderBills(selectedTrader.id || selectedTrader.traderId);
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
      await tradersAPI.recordPayment(selectedTrader.id || selectedTrader.traderId, paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({
        bill_id: '',
        amount: 0,
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: ''
      });
      fetchTraderBills(selectedTrader.id || selectedTrader.traderId);
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trader?')) return;
    try {
      await tradersAPI.delete(id);
      toast.success('Trader deleted successfully');
      fetchTraders();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const viewTrader = async (trader) => {
    setSelectedTrader(trader);
    setActiveTab('bills');
    fetchTraderBills(trader.id || trader.traderId);
  };

  const editTrader = (trader) => {
    setSelectedTrader(trader);
    setFormData({
      company_name: trader.companyName || trader.company_name || '',
      contact_person: trader.contactPerson || trader.contact_person || '',
      phone: trader.phone || '',
      email: trader.email || '',
      address: trader.address || '',
      tax_number: trader.taxNumber || trader.tax_number || '',
      payment_terms: trader.paymentTerms || trader.payment_terms || 30,
      credit_limit: trader.creditLimit || trader.credit_limit || 0,
      status: trader.status || 'active',
      notes: trader.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const viewBill = async (billId) => {
    try {
      const res = await tradersAPI.getBillById(billId);
      setSelectedBill(res.data.data);
      setShowViewBillModal(true);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const addBillItem = () => {
    setBillFormData({
      ...billFormData,
      items: [...billFormData.items, {
        product_id: '',
        description: '',
        quantity: 1,
        unit_cost: 0,
        total_cost: 0
      }]
    });
  };

  const updateBillItem = (index, field, value) => {
    const newItems = [...billFormData.items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'unit_cost') {
      newItems[index].total_cost = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].unit_cost) || 0);
    }

    setBillFormData({ ...billFormData, items: newItems });
  };

  const removeBillItem = (index) => {
    const newItems = billFormData.items.filter((_, i) => i !== index);
    setBillFormData({ ...billFormData, items: newItems });
  };

  const calculateBillTotal = () => {
    const subtotal = billFormData.items.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
    return subtotal + (parseFloat(billFormData.tax_amount) || 0);
  };

  // Generate auto bill number
  const generateBillNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `TRD-${year}-${random}`;
  };

  // Product search handler
  const handleProductSearch = (search, index) => {
    setProductSearch(search);
    setActiveItemIndex(index);
    if (search.length >= 2 && Array.isArray(products)) {
      const filtered = products.filter(p => {
        const name = (p.product_name_en || p.name_en || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        return name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase());
      });
      setProductSearchResults(filtered.slice(0, 8));
    } else {
      setProductSearchResults([]);
    }
  };

  // Select product from search
  const selectProduct = (product, index) => {
    const newItems = [...billFormData.items];
    newItems[index].product_id = product.product_id;
    newItems[index].description = product.product_name_en || product.name_en || '';
    newItems[index].unit_cost = parseFloat(product.base_price) || 0;
    newItems[index].total_cost = (newItems[index].unit_cost * (newItems[index].quantity || 1));
    setBillFormData({ ...billFormData, items: newItems });
    setProductSearch('');
    setProductSearchResults([]);
    setActiveItemIndex(null);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      payment_terms: 30,
      credit_limit: 0,
      status: 'active',
      notes: ''
    });
    setEditMode(false);
    setSelectedTrader(null);
  };

  const resetBillForm = () => {
    setBillFormData({
      bill_number: generateBillNumber(),
      bill_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tax_amount: 0,
      notes: '',
      bill_image: '',
      items: []
    });
    setProductSearch('');
    setProductSearchResults([]);
    setActiveItemIndex(null);
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'badge-success' : 'badge-secondary';
  };

  const getPaymentStatusBadge = (status) => {
    const badges = { unpaid: 'badge-danger', partial: 'badge-warning', paid: 'badge-success' };
    return badges[status] || 'badge-secondary';
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('traders.title') || 'Traders (Suppliers)'}</h1>
        {activeTab === 'traders' ? (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FiPlus /> {t('traders.addTrader')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => { setActiveTab('traders'); setSelectedTrader(null); }}>
              {t('traders.backToTraders')}
            </button>
            <button className="btn btn-primary" onClick={() => { resetBillForm(); setShowBillModal(true); }}>
              <FiFileText /> {t('traders.addBill')}
            </button>
            <button className="btn" style={{ background: '#22c55e', color: 'white' }} onClick={() => setShowPaymentModal(true)}>
              <FiDollarSign /> {t('traders.recordPayment')}
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      {statistics && activeTab === 'traders' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#3b82f6' }}>{statistics.totalTraders || statistics.total_traders || 0}</div>
            <div style={{ color: '#64748b' }}>{t('traders.totalTraders')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>
              ₪{parseFloat(statistics.totalDebt || statistics.total_balance || statistics.total_due || 0).toFixed(2)}
            </div>
            <div style={{ color: '#64748b' }}>{t('traders.totalDebt')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#22c55e' }}>
              ₪{parseFloat(statistics.totalPaid || statistics.total_payments || 0).toFixed(2)}
            </div>
            <div style={{ color: '#64748b' }}>{t('traders.totalPaid')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>{statistics.unpaidBills || statistics.unpaid_bills || 0}</div>
            <div style={{ color: '#64748b' }}>{t('traders.unpaidBills')}</div>
          </div>
        </div>
      )}

      {/* Trader Info Header when viewing bills */}
      {activeTab === 'bills' && selectedTrader && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedTrader.companyName || selectedTrader.company_name}</h2>
              <p style={{ color: '#64748b', margin: '5px 0' }}>
                {selectedTrader.contactPerson || selectedTrader.contact_person} | {selectedTrader.phone}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9em', color: '#64748b' }}>{t('traders.currentBalance')}</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ef4444' }}>
                ₪{parseFloat(selectedTrader.currentBalance || selectedTrader.current_balance || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'traders' && (
        <>
          <div className="filters">
            <input
              type="text"
              placeholder={t('app.search')}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
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
                    <th>{t('traders.company')}</th>
                    <th>{t('traders.contact')}</th>
                    <th>{t('traders.phone')}</th>
                    <th>{t('traders.creditLimit')}</th>
                    <th>{t('traders.balance')}</th>
                    <th>{t('app.status')}</th>
                    <th>{t('app.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {traders.length === 0 ? (
                    <tr><td colSpan="7" className="empty-state">{t('traders.noTraders')}</td></tr>
                  ) : (
                    traders.map(trader => (
                      <tr key={trader.id || trader.traderId}>
                        <td><strong>{trader.companyName || trader.company_name}</strong></td>
                        <td>{trader.contactPerson || trader.contact_person}</td>
                        <td>{trader.phone}</td>
                        <td>₪{parseFloat(trader.creditLimit || trader.credit_limit || 0).toFixed(2)}</td>
                        <td style={{ color: '#ef4444', fontWeight: 'bold' }}>
                          ₪{parseFloat(trader.currentBalance || trader.current_balance || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(trader.status)}`}>
                            {(trader.status || '').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon view" onClick={() => viewTrader(trader)} title="View Bills">
                              <FiFileText />
                            </button>
                            <button className="btn-icon edit" onClick={() => editTrader(trader)} title="Edit">
                              <FiEdit2 />
                            </button>
                            <button className="btn-icon delete" onClick={() => handleDelete(trader.id || trader.traderId)} title="Delete">
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
        </>
      )}

      {/* Bills Tab */}
      {activeTab === 'bills' && selectedTrader && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('traders.bill')} #</th>
                  <th>{t('traders.date')}</th>
                  <th>{t('traders.dueDate')}</th>
                  <th>{t('traders.total')}</th>
                  <th>{t('traders.paid')}</th>
                  <th>{t('traders.due')}</th>
                  <th>{t('app.status')}</th>
                  <th>{t('traders.image')}</th>
                  <th>{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {traderBills.length === 0 ? (
                  <tr><td colSpan="9" className="empty-state">{t('traders.noBills')}</td></tr>
                ) : (
                  traderBills.map(bill => (
                    <tr key={bill.billId || bill.bill_id}>
                      <td><strong>{bill.billNumber || bill.bill_number}</strong></td>
                      <td>{formatDate(bill.billDate || bill.bill_date)}</td>
                      <td>{bill.dueDate || bill.due_date ? formatDate(bill.dueDate || bill.due_date) : '-'}</td>
                      <td><strong>₪{parseFloat(bill.totalAmount || bill.total_amount || 0).toFixed(2)}</strong></td>
                      <td style={{ color: '#22c55e' }}>₪{parseFloat(bill.amountPaid || bill.amount_paid || 0).toFixed(2)}</td>
                      <td style={{ color: '#ef4444' }}>₪{parseFloat(bill.amountDue || bill.amount_due || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getPaymentStatusBadge(bill.paymentStatus || bill.payment_status)}`}>
                          {(bill.paymentStatus || bill.payment_status || '').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {(bill.billImage || bill.bill_image) ? (
                          <FiImage style={{ color: '#22c55e' }} />
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        <button className="btn-icon view" onClick={() => viewBill(bill.billId || bill.bill_id)} title="View">
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Trader Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editMode ? t('traders.editTrader') : t('traders.addTrader')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('traders.companyName')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.contactPerson')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.phone')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.email')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>{t('traders.address')}</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.taxNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.paymentTerms')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.payment_terms}
                      min="0"
                      onChange={(e) => setFormData({ ...formData, payment_terms: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.creditLimit')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.credit_limit}
                      min="0"
                      step="0.01"
                      onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('app.status')}</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">{t('app.active')}</option>
                      <option value="inactive">{t('app.inactive')}</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>{t('traders.notes')}</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editMode ? t('app.update') : t('app.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {showBillModal && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>{t('traders.createBillFor')} {selectedTrader?.companyName || selectedTrader?.company_name}</h3>
              <button className="btn-icon" onClick={() => setShowBillModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreateBill}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label>{t('traders.billNumber')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={billFormData.bill_number}
                      onChange={(e) => setBillFormData({ ...billFormData, bill_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.billDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={billFormData.bill_date}
                      onChange={(e) => setBillFormData({ ...billFormData, bill_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.dueDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={billFormData.due_date}
                      onChange={(e) => setBillFormData({ ...billFormData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontWeight: 'bold' }}>{t('traders.billItems')}</label>
                    <button type="button" className="btn btn-secondary" onClick={addBillItem}>
                      <FiPlus /> {t('app.add')}
                    </button>
                  </div>

                  {billFormData.items.length > 0 && (
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '220px' }}>{t('app.product') || 'Product'}</th>
                          <th>{t('app.description') || 'Description'}</th>
                          <th style={{ width: '100px' }}>{t('app.qty') || 'Qty'}</th>
                          <th style={{ width: '120px' }}>{t('traders.unitCost') || 'Unit Cost'}</th>
                          <th style={{ width: '120px' }}>{t('traders.total') || 'Total'}</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {billFormData.items.map((item, index) => (
                          <tr key={index}>
                            <td style={{ position: 'relative' }}>
                              {item.product_id ? (
                                <div style={{
                                  background: '#e0f2fe',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.85em'
                                }}>
                                  <span>{item.description || 'Product'}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newItems = [...billFormData.items];
                                      newItems[index].product_id = '';
                                      newItems[index].description = '';
                                      setBillFormData({ ...billFormData, items: newItems });
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                  >
                                    <FiX size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder={t('app.searchProduct') || 'Search product...'}
                                    value={activeItemIndex === index ? productSearch : ''}
                                    onChange={(e) => handleProductSearch(e.target.value, index)}
                                    onFocus={() => setActiveItemIndex(index)}
                                  />
                                  {activeItemIndex === index && productSearchResults.length > 0 && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      right: 0,
                                      background: 'white',
                                      border: '1px solid var(--border)',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                      zIndex: 100,
                                      maxHeight: '200px',
                                      overflowY: 'auto'
                                    }}>
                                      {productSearchResults.map(p => (
                                        <div
                                          key={p.product_id}
                                          style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #eee',
                                            fontSize: '0.85em'
                                          }}
                                          onClick={() => selectProduct(p, index)}
                                        >
                                          <strong>{p.product_name_en || p.name_en}</strong>
                                          <div style={{ color: '#64748b', fontSize: '0.8em' }}>
                                            SKU: {p.sku || '-'} | ₪{parseFloat(p.base_price || 0).toFixed(2)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={item.description}
                                onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                                placeholder={t('app.description')}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={item.quantity}
                                min="1"
                                onChange={(e) => updateBillItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={item.unit_cost}
                                min="0"
                                step="0.01"
                                onChange={(e) => updateBillItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                              ₪{(item.total_cost || 0).toFixed(2)}
                            </td>
                            <td>
                              <button type="button" className="btn-icon delete" onClick={() => removeBillItem(index)}>
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('traders.taxAmount')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={billFormData.tax_amount}
                      min="0"
                      step="0.01"
                      onChange={(e) => setBillFormData({ ...billFormData, tax_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('traders.notes')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={billFormData.notes}
                      onChange={(e) => setBillFormData({ ...billFormData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label><FiImage style={{ marginRight: '5px' }} />{t('traders.billImageOptional') || 'Bill Image (Optional)'}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billFormData.bill_image}
                    onChange={(e) => setBillFormData({ ...billFormData, bill_image: e.target.value })}
                    placeholder={t('traders.pasteImageUrl') || 'Paste image URL here...'}
                    style={{ marginBottom: '10px' }}
                  />
                  {billFormData.bill_image && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={billFormData.bill_image}
                        alt="Bill Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setBillFormData({ ...billFormData, bill_image: '' })}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ef4444',
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
                  )}
                </div>

                <div style={{
                  background: '#f1f5f9',
                  padding: '15px',
                  borderRadius: '8px',
                  marginTop: '20px',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '1.2em' }}>
                    {t('traders.total')}: <strong>₪{calculateBillTotal().toFixed(2)}</strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBillModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('traders.createBill')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedTrader && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('traders.recordPayment')} - {selectedTrader.companyName || selectedTrader.company_name}</h3>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('traders.billOptional')}</label>
                  <select
                    className="form-control"
                    value={paymentData.bill_id}
                    onChange={(e) => setPaymentData({ ...paymentData, bill_id: e.target.value })}
                  >
                    <option value="">{t('app.generalPayment')}</option>
                    {traderBills.filter(b => b.paymentStatus !== 'paid').map(bill => (
                      <option key={bill.billId || bill.bill_id} value={bill.billId || bill.bill_id}>
                        {bill.billNumber || bill.bill_number} - {t('traders.due')}: ₪{parseFloat(bill.amountDue || bill.amount_due || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('app.amount')} *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentData.amount}
                    min="0.01"
                    step="0.01"
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('traders.paymentMethod')}</label>
                  <select
                    className="form-control"
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  >
                    <option value="cash">{t('traders.paymentMethods.cash')}</option>
                    <option value="check">{t('traders.paymentMethods.check')}</option>
                    <option value="bank_transfer">{t('traders.paymentMethods.bank_transfer')}</option>
                    <option value="other">{t('traders.paymentMethods.other')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('traders.paymentDate')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('app.referenceNumber')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={paymentData.reference_number}
                    onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('traders.notes')}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('traders.recordPayment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {showViewBillModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowViewBillModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{t('traders.bill')} #{selectedBill.billNumber || selectedBill.bill_number}</h3>
              <button className="btn-icon" onClick={() => setShowViewBillModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p><strong>{t('traders.billDate')}:</strong> {formatDate(selectedBill.billDate || selectedBill.bill_date)}</p>
                  {(selectedBill.dueDate || selectedBill.due_date) && <p><strong>{t('traders.dueDate')}:</strong> {formatDate(selectedBill.dueDate || selectedBill.due_date)}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${getPaymentStatusBadge(selectedBill.paymentStatus || selectedBill.payment_status)}`}>
                    {(selectedBill.paymentStatus || selectedBill.payment_status || '').toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedBill.billImage && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <img
                    src={getImageUrl(selectedBill.billImage || selectedBill.bill_image)}
                    alt="Bill"
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th>{t('app.description')}</th>
                    <th>{t('app.qty')}</th>
                    <th>{t('traders.unitCost')}</th>
                    <th>{t('traders.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBill.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>₪{parseFloat(item.unitCost || item.unit_cost || 0).toFixed(2)}</td>
                      <td>₪{parseFloat(item.totalCost || item.total_cost || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right' }}>{t('traders.subtotal')}:</td>
                    <td><strong>₪{parseFloat(selectedBill.subtotal || 0).toFixed(2)}</strong></td>
                  </tr>
                  {parseFloat(selectedBill.taxAmount || selectedBill.tax_amount) > 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right' }}>{t('traders.tax')}:</td>
                      <td>₪{parseFloat(selectedBill.taxAmount || selectedBill.tax_amount).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right' }}><strong>{t('traders.total')}:</strong></td>
                    <td><strong>₪{parseFloat(selectedBill.totalAmount || selectedBill.total_amount || 0).toFixed(2)}</strong></td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right' }}>{t('traders.paid')}:</td>
                    <td style={{ color: '#22c55e' }}>₪{parseFloat(selectedBill.amountPaid || selectedBill.amount_paid || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right' }}><strong>{t('traders.due')}:</strong></td>
                    <td style={{ color: '#ef4444' }}><strong>₪{parseFloat(selectedBill.amountDue || selectedBill.amount_due || 0).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              {selectedBill.notes && (
                <p style={{ marginTop: '15px' }}><strong>{t('traders.notes')}:</strong> {selectedBill.notes}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewBillModal(false)}>{t('app.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Traders;
