import { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiX, FiDollarSign, FiShoppingCart } from 'react-icons/fi';
import { wholesalersAPI, productsAPI, testAPI } from '../../services/api';
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

const Wholesalers = () => {
  const { t } = useLanguage();
  const [wholesalers, setWholesalers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wholesalers');
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewOrderModal, setShowViewOrderModal] = useState(false);
  const [selectedWholesaler, setSelectedWholesaler] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [statistics, setStatistics] = useState(null);

  // Wholesaler orders
  const [wholesalerOrders, setWholesalerOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Products
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
    discount_percentage: 0,
    credit_limit: 0,
    status: 'active',
    notes: ''
  });

  const [orderFormData, setOrderFormData] = useState({
    order_date: new Date().toISOString().split('T')[0],
    discount_amount: 0,
    tax_amount: 0,
    order_status: 'pending',
    notes: '',
    items: []
  });

  const [paymentData, setPaymentData] = useState({
    order_id: '',
    amount: 0,
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchWholesalers();
    fetchStatistics();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (showOrderModal) {
      fetchProducts();
    }
  }, [showOrderModal]);

  const fetchWholesalers = async () => {
    try {
      const res = await wholesalersAPI.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setWholesalers(res.data.data || []);
      setPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching wholesalers:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await wholesalersAPI.getStatistics();
      setStatistics(res.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchWholesalerOrders = async (wholesalerId) => {
    try {
      const res = await wholesalersAPI.getOrders(wholesalerId, {
        page: ordersPagination.page,
        limit: ordersPagination.limit
      });
      setWholesalerOrders(res.data.data || []);
      setOrdersPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching orders:', error);
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
    const newItems = [...orderFormData.items];
    newItems[index].product_id = product.product_id;
    newItems[index].unit_price = parseFloat(product.base_price || product.price || 0);
    setOrderFormData({ ...orderFormData, items: newItems });
    setProductSearch('');
    setProductSearchResults([]);
    setActiveItemIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name) {
      toast.error(t('wholesalers.companyNameRequired'));
      return;
    }

    try {
      if (editMode && selectedWholesaler) {
        await wholesalersAPI.update(selectedWholesaler.id || selectedWholesaler.wholesalerId, formData);
        toast.success(t('wholesalers.wholesalerUpdated'));
      } else {
        await wholesalersAPI.create(formData);
        toast.success(t('wholesalers.wholesalerCreated'));
      }
      setShowModal(false);
      resetForm();
      fetchWholesalers();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (orderFormData.items.length === 0) {
      toast.error(t('wholesalers.addAtLeastOneItem'));
      return;
    }

    try {
      await wholesalersAPI.createOrder(selectedWholesaler.id || selectedWholesaler.wholesalerId, orderFormData);
      toast.success(t('wholesalers.orderCreated'));
      setShowOrderModal(false);
      resetOrderForm();
      fetchWholesalerOrders(selectedWholesaler.id || selectedWholesaler.wholesalerId);
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error(t('wholesalers.validAmountRequired'));
      return;
    }

    try {
      await wholesalersAPI.recordPayment(selectedWholesaler.id || selectedWholesaler.wholesalerId, paymentData);
      toast.success(t('wholesalers.paymentRecorded'));
      setShowPaymentModal(false);
      setPaymentData({
        order_id: '',
        amount: 0,
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: ''
      });
      fetchWholesalerOrders(selectedWholesaler.id || selectedWholesaler.wholesalerId);
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('wholesalers.deleteConfirm'))) return;
    try {
      await wholesalersAPI.delete(id);
      toast.success(t('wholesalers.wholesalerDeleted'));
      fetchWholesalers();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const viewWholesaler = async (wholesaler) => {
    setSelectedWholesaler(wholesaler);
    setActiveTab('orders');
    fetchWholesalerOrders(wholesaler.id || wholesaler.wholesalerId);
  };

  const editWholesaler = (wholesaler) => {
    setSelectedWholesaler(wholesaler);
    setFormData({
      company_name: wholesaler.companyName || wholesaler.company_name || '',
      contact_person: wholesaler.contactPerson || wholesaler.contact_person || '',
      phone: wholesaler.phone || '',
      email: wholesaler.email || '',
      address: wholesaler.address || '',
      tax_number: wholesaler.taxNumber || wholesaler.tax_number || '',
      discount_percentage: wholesaler.discountPercentage || wholesaler.discount_percentage || 0,
      credit_limit: wholesaler.creditLimit || wholesaler.credit_limit || 0,
      status: wholesaler.status || 'active',
      notes: wholesaler.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const viewOrder = async (orderId) => {
    try {
      const res = await wholesalersAPI.getOrderById(orderId);
      setSelectedOrder(res.data.data);
      setShowViewOrderModal(true);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const addOrderItem = () => {
    setOrderFormData({
      ...orderFormData,
      items: [...orderFormData.items, {
        product_id: '',
        variant_id: null,
        quantity: 1,
        unit_price: 0,
        discount_percent: selectedWholesaler?.discountPercentage || selectedWholesaler?.discount_percentage || 0
      }]
    });
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderFormData.items];
    newItems[index][field] = value;
    setOrderFormData({ ...orderFormData, items: newItems });
  };

  const removeOrderItem = (index) => {
    const newItems = orderFormData.items.filter((_, i) => i !== index);
    setOrderFormData({ ...orderFormData, items: newItems });
  };

  const calculateOrderSubtotal = () => {
    return orderFormData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const discount = parseFloat(item.discount_percent) || 0;
      return sum + (qty * price * (1 - discount / 100));
    }, 0);
  };

  const calculateOrderTotal = () => {
    const subtotal = calculateOrderSubtotal();
    const tax = parseFloat(orderFormData.tax_amount) || 0;
    const discount = parseFloat(orderFormData.discount_amount) || 0;
    return subtotal + tax - discount;
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      discount_percentage: 0,
      credit_limit: 0,
      status: 'active',
      notes: ''
    });
    setEditMode(false);
    setSelectedWholesaler(null);
  };

  const resetOrderForm = () => {
    setOrderFormData({
      order_date: new Date().toISOString().split('T')[0],
      discount_amount: 0,
      tax_amount: 0,
      order_status: 'pending',
      notes: '',
      items: []
    });
    setProductSearch('');
    setProductSearchResults([]);
    setActiveItemIndex(null);
  };

  // Get product name by ID
  const getProductName = (productId) => {
    if (!productId) return '';
    const product = products.find(p => p.product_id == productId);
    return product ? (product.product_name_en || product.name_en || 'Product') : '';
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'badge-success' : 'badge-secondary';
  };

  const getPaymentStatusBadge = (status) => {
    const badges = { unpaid: 'badge-danger', partial: 'badge-warning', paid: 'badge-success' };
    return badges[status] || 'badge-secondary';
  };

  const getOrderStatusBadge = (status) => {
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

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('wholesalers.title') || 'Wholesalers'}</h1>
        {activeTab === 'wholesalers' ? (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FiPlus /> {t('wholesalers.addWholesaler')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => { setActiveTab('wholesalers'); setSelectedWholesaler(null); }}>
              {t('wholesalers.backToWholesalers')}
            </button>
            <button className="btn btn-primary" onClick={() => { resetOrderForm(); setShowOrderModal(true); }}>
              <FiShoppingCart /> {t('wholesalers.createOrder')}
            </button>
            <button className="btn" style={{ background: '#22c55e', color: 'white' }} onClick={() => setShowPaymentModal(true)}>
              <FiDollarSign /> {t('wholesalers.recordPayment')}
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      {statistics && activeTab === 'wholesalers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#3b82f6' }}>{statistics.totalWholesalers || statistics.total_wholesalers || 0}</div>
            <div style={{ color: '#64748b' }}>{t('wholesalers.totalWholesalers')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#22c55e' }}>
              ₪{parseFloat(statistics.totalSales || statistics.total_sales || 0).toFixed(2)}
            </div>
            <div style={{ color: '#64748b' }}>{t('wholesalers.totalSales')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>
              ₪{parseFloat(statistics.totalDebt || statistics.total_balance || statistics.total_due || 0).toFixed(2)}
            </div>
            <div style={{ color: '#64748b' }}>{t('wholesalers.totalOutstanding')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>{statistics.pendingOrders || statistics.unpaid_orders || 0}</div>
            <div style={{ color: '#64748b' }}>{t('wholesalers.pendingOrders')}</div>
          </div>
        </div>
      )}

      {/* Wholesaler Info Header when viewing orders */}
      {activeTab === 'orders' && selectedWholesaler && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedWholesaler.companyName || selectedWholesaler.company_name}</h2>
              <p style={{ color: '#64748b', margin: '5px 0' }}>
                {selectedWholesaler.contactPerson || selectedWholesaler.contact_person} | {selectedWholesaler.phone}
              </p>
              <p style={{ color: '#64748b', margin: 0 }}>
                {t('wholesalers.defaultDiscount')}: {selectedWholesaler.discountPercentage || selectedWholesaler.discount_percentage || 0}%
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9em', color: '#64748b' }}>{t('wholesalers.currentBalance')}</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ef4444' }}>
                ₪{parseFloat(selectedWholesaler.currentBalance || selectedWholesaler.current_balance || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.9em', color: '#64748b', marginTop: '5px' }}>
                {t('wholesalers.totalSales')}: ₪{parseFloat(selectedWholesaler.totalSales || selectedWholesaler.total_sales || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wholesalers' && (
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
                    <th>{t('wholesalers.company')}</th>
                    <th>{t('wholesalers.contact')}</th>
                    <th>{t('wholesalers.phone')}</th>
                    <th>{t('wholesalers.discountPercent')}</th>
                    <th>{t('wholesalers.totalSales')}</th>
                    <th>{t('wholesalers.balance')}</th>
                    <th>{t('app.status')}</th>
                    <th>{t('app.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {wholesalers.length === 0 ? (
                    <tr><td colSpan="8" className="empty-state">{t('wholesalers.noWholesalers')}</td></tr>
                  ) : (
                    wholesalers.map(wholesaler => (
                      <tr key={wholesaler.id || wholesaler.wholesalerId}>
                        <td><strong>{wholesaler.companyName || wholesaler.company_name}</strong></td>
                        <td>{wholesaler.contactPerson || wholesaler.contact_person}</td>
                        <td>{wholesaler.phone}</td>
                        <td>{wholesaler.discountPercentage || wholesaler.discount_percentage || 0}%</td>
                        <td style={{ color: '#22c55e' }}>
                          ₪{parseFloat(wholesaler.totalSales || wholesaler.total_sales || 0).toFixed(2)}
                        </td>
                        <td style={{ color: '#ef4444', fontWeight: 'bold' }}>
                          ₪{parseFloat(wholesaler.currentBalance || wholesaler.current_balance || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(wholesaler.status)}`}>
                            {(wholesaler.status || '').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon view" onClick={() => viewWholesaler(wholesaler)} title={t('wholesalers.viewOrders')}>
                              <FiShoppingCart />
                            </button>
                            <button className="btn-icon edit" onClick={() => editWholesaler(wholesaler)} title={t('app.edit')}>
                              <FiEdit2 />
                            </button>
                            <button className="btn-icon delete" onClick={() => handleDelete(wholesaler.id || wholesaler.wholesalerId)} title={t('app.delete')}>
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

      {/* Orders Tab */}
      {activeTab === 'orders' && selectedWholesaler && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('wholesalers.order')} #</th>
                  <th>{t('wholesalers.date')}</th>
                  <th>{t('wholesalers.items')}</th>
                  <th>{t('wholesalers.total')}</th>
                  <th>{t('wholesalers.paid')}</th>
                  <th>{t('wholesalers.due')}</th>
                  <th>{t('wholesalers.payment')}</th>
                  <th>{t('app.status')}</th>
                  <th>{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {wholesalerOrders.length === 0 ? (
                  <tr><td colSpan="9" className="empty-state">{t('wholesalers.noOrders')}</td></tr>
                ) : (
                  wholesalerOrders.map(order => (
                    <tr key={order.orderId || order.order_id}>
                      <td><strong>{order.orderNumber || order.order_number}</strong></td>
                      <td>{formatDate(order.orderDate || order.order_date)}</td>
                      <td>{order.itemCount || order.item_count || 0}</td>
                      <td><strong>₪{parseFloat(order.totalAmount || order.total_amount || 0).toFixed(2)}</strong></td>
                      <td style={{ color: '#22c55e' }}>₪{parseFloat(order.amountPaid || order.amount_paid || 0).toFixed(2)}</td>
                      <td style={{ color: '#ef4444' }}>₪{parseFloat(order.amountDue || order.amount_due || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getPaymentStatusBadge(order.paymentStatus || order.payment_status)}`}>
                          {(order.paymentStatus || order.payment_status || '').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getOrderStatusBadge(order.orderStatus || order.order_status)}`}>
                          {(order.orderStatus || order.order_status || '').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon view" onClick={() => viewOrder(order.orderId || order.order_id)} title={t('app.view')}>
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

      {/* Add/Edit Wholesaler Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editMode ? t('wholesalers.editWholesaler') : t('wholesalers.addWholesaler')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('wholesalers.companyName')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.contactPerson')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.phone')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.email')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>{t('wholesalers.address')}</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.taxNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.defaultDiscountPercent')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.discount_percentage}
                      min="0"
                      max="100"
                      step="0.01"
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.creditLimit')}</label>
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
                    <label>{t('wholesalers.notes')}</label>
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

      {/* Create Order Modal */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>{t('wholesalers.createOrderFor')} {selectedWholesaler?.companyName || selectedWholesaler?.company_name}</h3>
              <button className="btn-icon" onClick={() => setShowOrderModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label>{t('wholesalers.orderDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={orderFormData.order_date}
                      onChange={(e) => setOrderFormData({ ...orderFormData, order_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.orderStatus')}</label>
                    <select
                      className="form-control"
                      value={orderFormData.order_status}
                      onChange={(e) => setOrderFormData({ ...orderFormData, order_status: e.target.value })}
                    >
                      <option value="pending">{t('wholesalers.orderStatuses.pending')}</option>
                      <option value="confirmed">{t('wholesalers.orderStatuses.confirmed')}</option>
                      <option value="processing">{t('wholesalers.orderStatuses.processing')}</option>
                      <option value="shipped">{t('wholesalers.orderStatuses.shipped')}</option>
                      <option value="delivered">{t('wholesalers.orderStatuses.delivered')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.notes')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={orderFormData.notes}
                      onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontWeight: 'bold' }}>{t('wholesalers.orderItems')}</label>
                    <button type="button" className="btn btn-secondary" onClick={addOrderItem}>
                      <FiPlus /> {t('app.add')}
                    </button>
                  </div>

                  {orderFormData.items.length > 0 && (
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '220px' }}>{t('app.product') || 'Product'}</th>
                          <th style={{ width: '100px' }}>{t('app.qty') || 'Qty'}</th>
                          <th style={{ width: '120px' }}>{t('wholesalers.unitPrice') || 'Unit Price'}</th>
                          <th style={{ width: '100px' }}>{t('wholesalers.discountPercent') || 'Disc %'}</th>
                          <th style={{ width: '120px' }}>{t('wholesalers.total') || 'Total'}</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderFormData.items.map((item, index) => (
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
                                  <span>{getProductName(item.product_id)}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newItems = [...orderFormData.items];
                                      newItems[index].product_id = '';
                                      newItems[index].unit_price = 0;
                                      setOrderFormData({ ...orderFormData, items: newItems });
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
                                            SKU: {p.sku || '-'} | ₪{parseFloat(p.base_price || p.price || 0).toFixed(2)}
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
                                type="number"
                                className="form-control"
                                value={item.quantity}
                                min="1"
                                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={item.unit_price}
                                min="0"
                                step="0.01"
                                onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={item.discount_percent}
                                min="0"
                                max="100"
                                onChange={(e) => updateOrderItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                              ₪{((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0) * (1 - (parseFloat(item.discount_percent) || 0) / 100)).toFixed(2)}
                            </td>
                            <td>
                              <button type="button" className="btn-icon delete" onClick={() => removeOrderItem(index)}>
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
                    <label>{t('wholesalers.taxAmount')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={orderFormData.tax_amount}
                      min="0"
                      step="0.01"
                      onChange={(e) => setOrderFormData({ ...orderFormData, tax_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('wholesalers.additionalDiscount')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={orderFormData.discount_amount}
                      min="0"
                      step="0.01"
                      onChange={(e) => setOrderFormData({ ...orderFormData, discount_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{
                  background: '#f1f5f9',
                  padding: '15px',
                  borderRadius: '8px',
                  marginTop: '20px',
                  textAlign: 'right'
                }}>
                  <div style={{ marginBottom: '5px' }}>{t('wholesalers.subtotal')}: <strong>₪{calculateOrderSubtotal().toFixed(2)}</strong></div>
                  <div style={{ marginBottom: '5px' }}>{t('wholesalers.tax')}: <strong>₪{parseFloat(orderFormData.tax_amount || 0).toFixed(2)}</strong></div>
                  <div style={{ marginBottom: '5px' }}>{t('wholesalers.discount')}: <strong>-₪{parseFloat(orderFormData.discount_amount || 0).toFixed(2)}</strong></div>
                  <div style={{ fontSize: '1.2em', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    {t('wholesalers.total')}: <strong>₪{calculateOrderTotal().toFixed(2)}</strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('wholesalers.createOrder')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedWholesaler && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('wholesalers.recordPayment')} - {selectedWholesaler.companyName || selectedWholesaler.company_name}</h3>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('wholesalers.orderOptional')}</label>
                  <select
                    className="form-control"
                    value={paymentData.order_id}
                    onChange={(e) => setPaymentData({ ...paymentData, order_id: e.target.value })}
                  >
                    <option value="">{t('app.generalPayment')}</option>
                    {wholesalerOrders.filter(o => o.paymentStatus !== 'paid').map(order => (
                      <option key={order.orderId || order.order_id} value={order.orderId || order.order_id}>
                        {order.orderNumber || order.order_number} - {t('wholesalers.due')}: ₪{parseFloat(order.amountDue || order.amount_due || 0).toFixed(2)}
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
                  <label>{t('wholesalers.paymentMethod')}</label>
                  <select
                    className="form-control"
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  >
                    <option value="cash">{t('wholesalers.paymentMethods.cash')}</option>
                    <option value="check">{t('wholesalers.paymentMethods.check')}</option>
                    <option value="bank_transfer">{t('wholesalers.paymentMethods.bank_transfer')}</option>
                    <option value="other">{t('wholesalers.paymentMethods.other')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('wholesalers.paymentDate')}</label>
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
                  <label>{t('wholesalers.notes')}</label>
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
                <button type="submit" className="btn btn-primary">{t('wholesalers.recordPayment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowViewOrderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{t('wholesalers.order')} #{selectedOrder.orderNumber || selectedOrder.order_number}</h3>
              <button className="btn-icon" onClick={() => setShowViewOrderModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p><strong>{t('wholesalers.orderDate')}:</strong> {formatDate(selectedOrder.orderDate || selectedOrder.order_date)}</p>
                  <p><strong>{t('wholesalers.orderStatus')}:</strong> <span className={`badge ${getOrderStatusBadge(selectedOrder.orderStatus || selectedOrder.order_status)}`}>{(selectedOrder.orderStatus || selectedOrder.order_status || '').toUpperCase()}</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${getPaymentStatusBadge(selectedOrder.paymentStatus || selectedOrder.payment_status)}`}>
                    {(selectedOrder.paymentStatus || selectedOrder.payment_status || '').toUpperCase()}
                  </span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>{t('app.product')}</th>
                    <th>{t('app.qty')}</th>
                    <th>{t('wholesalers.price')}</th>
                    <th>{t('wholesalers.discountPercent')}</th>
                    <th>{t('wholesalers.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productName || item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>₪{parseFloat(item.unitPrice || item.unit_price || 0).toFixed(2)}</td>
                      <td>{item.discountPercent || item.discount_percent || 0}%</td>
                      <td>₪{parseFloat(item.totalPrice || item.total_price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right' }}>{t('wholesalers.subtotal')}:</td>
                    <td><strong>₪{parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</strong></td>
                  </tr>
                  {parseFloat(selectedOrder.discountAmount || selectedOrder.discount_amount) > 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right' }}>{t('wholesalers.discount')}:</td>
                      <td style={{ color: '#22c55e' }}>-₪{parseFloat(selectedOrder.discountAmount || selectedOrder.discount_amount).toFixed(2)}</td>
                    </tr>
                  )}
                  {parseFloat(selectedOrder.taxAmount || selectedOrder.tax_amount) > 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right' }}>{t('wholesalers.tax')}:</td>
                      <td>₪{parseFloat(selectedOrder.taxAmount || selectedOrder.tax_amount).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right' }}><strong>{t('wholesalers.total')}:</strong></td>
                    <td><strong>₪{parseFloat(selectedOrder.totalAmount || selectedOrder.total_amount || 0).toFixed(2)}</strong></td>
                  </tr>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right' }}>{t('wholesalers.paid')}:</td>
                    <td style={{ color: '#22c55e' }}>₪{parseFloat(selectedOrder.amountPaid || selectedOrder.amount_paid || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right' }}><strong>{t('wholesalers.due')}:</strong></td>
                    <td style={{ color: '#ef4444' }}><strong>₪{parseFloat(selectedOrder.amountDue || selectedOrder.amount_due || 0).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              {selectedOrder.notes && (
                <p style={{ marginTop: '15px' }}><strong>{t('wholesalers.notes')}:</strong> {selectedOrder.notes}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewOrderModal(false)}>{t('app.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wholesalers;
