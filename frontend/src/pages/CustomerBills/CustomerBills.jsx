import { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiX, FiPrinter, FiDollarSign, FiSearch, FiShoppingCart } from 'react-icons/fi';
import { customerBillsAPI, productsAPI, ordersAPI, testAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

// Helper function to format date properly
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const CustomerBills = () => {
  const { t } = useLanguage();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({ search: '', payment_status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // For creating/editing bills
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    bill_date: new Date().toISOString().split('T')[0],
    tax_amount: 0,
    discount_amount: 0,
    notes: '',
    items: []
  });

  // For payment
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: 'cash',
    notes: ''
  });

  // For product search in bill
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // For importing from orders
  const [orders, setOrders] = useState([]);
  const [showOrderImport, setShowOrderImport] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSearchResults, setOrderSearchResults] = useState([]);

  // For manual item entry
  const [manualItem, setManualItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
    discount_percent: 0
  });

  // For print language selection
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printLanguage, setPrintLanguage] = useState('en');
  const [billToPrint, setBillToPrint] = useState(null);

  useEffect(() => {
    fetchBills();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (showModal) {
      fetchProducts();
      fetchOrders();
    }
  }, [showModal]);

  const fetchBills = async () => {
    try {
      const res = await customerBillsAPI.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setBills(res.data.data || []);
      setPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Use test API to avoid auth issues
      const res = await testAPI.getProducts({ limit: 100, status: 'active' });
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to regular API
      try {
        const res = await productsAPI.getAll({ limit: 100, status: 'active' });
        setProducts(res.data.data || []);
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    }
  };

  const fetchOrders = async () => {
    try {
      // Use test API to avoid auth issues - fetch recent orders sorted by date (newest first)
      const res = await testAPI.getOrders({ limit: 50 });
      const ordersData = res.data.data || [];
      // Sort by date descending (most recent first)
      ordersData.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt);
        const dateB = new Date(b.created_at || b.createdAt);
        return dateB - dateA;
      });
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to regular API
      try {
        const res = await ordersAPI.getAll({ limit: 50, sort: 'created_at', order: 'desc' });
        const ordersData = res.data.data || [];
        ordersData.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt);
          const dateB = new Date(b.created_at || b.createdAt);
          return dateB - dateA;
        });
        setOrders(ordersData);
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    }
  };

  // Order search handler
  const handleOrderSearch = (search) => {
    setOrderSearch(search);
    if (search.length >= 1) {
      const filtered = orders.filter(o => {
        const orderNum = (o.order_number || o.orderNumber || '').toLowerCase();
        const customerName = (o.customer_name || o.customerName || '').toLowerCase();
        return orderNum.includes(search.toLowerCase()) || customerName.includes(search.toLowerCase());
      });
      setOrderSearchResults(filtered.slice(0, 10));
    } else {
      setOrderSearchResults(orders.slice(0, 10));
    }
  };

  // Import data from order
  const importFromOrder = async (order) => {
    try {
      // Use testAPI to avoid auth issues
      const res = await testAPI.getOrderById(order.order_id || order.orderId);
      const orderData = res.data.data;

      // Set customer name and phone from order
      const customerName = orderData.guest_name || orderData.customer_name || order.customer_name || order.customerName || '';
      const customerPhone = orderData.guest_phone || orderData.customer_phone || order.customer_phone || order.customerPhone || '';

      // Set items from order
      const items = (orderData.items || []).map(item => ({
        product_id: item.product_id || item.productId,
        description: item.product_name || item.productName || item.name_en || 'Product',
        quantity: item.quantity,
        unit_price: parseFloat(item.price || item.unit_price || 0),
        discount_percent: 0,
        total_price: parseFloat(item.total_price || item.totalPrice || (item.quantity * item.price) || 0)
      }));

      setFormData(prev => ({
        ...prev,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: items,
        notes: `Imported from Order #${orderData.order_number || orderData.orderNumber}`
      }));

      setShowOrderImport(false);
      setOrderSearch('');
      toast.success('Order data imported successfully');
    } catch (error) {
      console.error('Error importing order:', error);
      toast.error('Failed to import order data');
    }
  };

  // Add manual item
  const addManualItem = () => {
    if (!manualItem.description) {
      toast.error('Please enter item description');
      return;
    }
    if (manualItem.unit_price <= 0) {
      toast.error('Please enter valid unit price');
      return;
    }

    const totalPrice = manualItem.quantity * manualItem.unit_price * (1 - manualItem.discount_percent / 100);
    setFormData({
      ...formData,
      items: [...formData.items, {
        product_id: null,
        description: manualItem.description,
        quantity: manualItem.quantity,
        unit_price: manualItem.unit_price,
        discount_percent: manualItem.discount_percent,
        total_price: totalPrice
      }]
    });
    setManualItem({ description: '', quantity: 1, unit_price: 0, discount_percent: 0 });
  };

  const handleProductSearch = (search) => {
    setProductSearch(search);
    if (search.length >= 2) {
      const filtered = products.filter(p =>
        (p.name_en || p.product_name_en || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(search.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  };

  const addProductToItems = (product) => {
    const existingIndex = formData.items.findIndex(item => item.product_id === product.product_id);
    if (existingIndex >= 0) {
      const newItems = [...formData.items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total_price = newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      setFormData({ ...formData, items: newItems });
    } else {
      const price = parseFloat(product.price || product.base_price || 0);
      setFormData({
        ...formData,
        items: [...formData.items, {
          product_id: product.product_id,
          description: product.name_en || product.product_name_en || 'Product',
          quantity: 1,
          unit_price: price,
          discount_percent: 0,
          total_price: price
        }]
      });
    }
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Recalculate total
    const qty = parseFloat(newItems[index].quantity) || 0;
    const price = parseFloat(newItems[index].unit_price) || 0;
    const discount = parseFloat(newItems[index].discount_percent) || 0;
    newItems[index].total_price = qty * price * (1 - discount / 100);

    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = parseFloat(formData.tax_amount) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    return subtotal + tax - discount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name) {
      toast.error('Please enter customer name');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Calculate totals and prepare submission data
    const subtotal = calculateSubtotal();
    const total = calculateTotal();

    const submitData = {
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone || '',
      bill_date: formData.bill_date || new Date().toISOString().split('T')[0],
      subtotal: subtotal,
      tax_amount: parseFloat(formData.tax_amount) || 0,
      discount_amount: parseFloat(formData.discount_amount) || 0,
      total_amount: total,
      notes: formData.notes || '',
      items: formData.items.map(item => ({
        product_id: item.product_id || null,
        description: item.description || 'Item',
        quantity: parseInt(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        discount_percent: parseFloat(item.discount_percent) || 0,
        total_price: parseFloat(item.total_price) || 0
      }))
    };

    try {
      if (editMode && selectedBill) {
        await customerBillsAPI.update(selectedBill.id, submitData);
        toast.success('Bill updated successfully');
      } else {
        await customerBillsAPI.create(submitData);
        toast.success('Bill created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchBills();
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
      await customerBillsAPI.recordPayment(selectedBill.id, paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({ amount: 0, payment_method: 'cash', notes: '' });
      fetchBills();
      if (showViewModal) {
        viewBill(selectedBill);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await customerBillsAPI.delete(id);
      toast.success('Bill deleted successfully');
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const viewBill = async (bill) => {
    try {
      const res = await customerBillsAPI.getById(bill.id || bill.billId);
      setSelectedBill(res.data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const editBill = async (bill) => {
    try {
      const res = await customerBillsAPI.getById(bill.id || bill.billId);
      const billData = res.data.data;
      setSelectedBill(billData);
      setFormData({
        customer_name: billData.customerName || billData.customer_name || '',
        customer_phone: billData.customerPhone || billData.customer_phone || '',
        bill_date: billData.billDate?.split('T')[0] || billData.bill_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        tax_amount: billData.taxAmount || billData.tax_amount || 0,
        discount_amount: billData.discountAmount || billData.discount_amount || 0,
        notes: billData.notes || '',
        items: (billData.items || []).map(item => ({
          item_id: item.itemId || item.item_id,
          product_id: item.productId || item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice || item.unit_price,
          discount_percent: item.discountPercent || item.discount_percent || 0,
          total_price: item.totalPrice || item.total_price
        }))
      });
      setEditMode(true);
      setShowModal(true);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: parseFloat(bill.amountDue || bill.amount_due) || 0,
      payment_method: 'cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  // Open print language selection modal
  const openPrintModal = (bill) => {
    setBillToPrint(bill);
    setShowPrintModal(true);
  };

  // Print translations for different languages
  const printTranslations = {
    en: {
      billTitle: 'Bill',
      customer: 'Customer',
      date: 'Date',
      status: 'Status',
      description: 'Description',
      qty: 'Qty',
      unitPrice: 'Unit Price',
      discount: 'Discount',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Tax',
      amountPaid: 'Amount Paid',
      amountDue: 'Amount Due',
      notes: 'Notes',
      statuses: { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' }
    },
    ar: {
      billTitle: 'فاتورة',
      customer: 'العميل',
      date: 'التاريخ',
      status: 'الحالة',
      description: 'الوصف',
      qty: 'الكمية',
      unitPrice: 'سعر الوحدة',
      discount: 'الخصم',
      total: 'المجموع',
      subtotal: 'المجموع الفرعي',
      tax: 'الضريبة',
      amountPaid: 'المبلغ المدفوع',
      amountDue: 'المبلغ المستحق',
      notes: 'ملاحظات',
      statuses: { unpaid: 'غير مدفوع', partial: 'مدفوع جزئياً', paid: 'مدفوع' }
    }
  };

  // Helper to get product name in selected language
  const getProductName = (item, lang) => {
    if (lang === 'ar') {
      return item.productNameAr || item.product_name_ar || item.description || item.productName || 'Product';
    }
    return item.productNameEn || item.product_name_en || item.description || item.productName || 'Product';
  };

  const printBill = async (bill, language = 'en') => {
    try {
      const res = await customerBillsAPI.getPrintData(bill.id || bill.billId);
      const printData = res.data.data;
      const pt = printTranslations[language] || printTranslations.en;
      const isRTL = language === 'ar';
      const direction = isRTL ? 'rtl' : 'ltr';
      const textAlign = isRTL ? 'right' : 'left';
      const statusText = pt.statuses[printData.paymentStatus] || printData.paymentStatus;

      // Font family based on language
      const fontFamily = isRTL ? "'Segoe UI', 'Arial', 'Tahoma', sans-serif" : "Arial, sans-serif";

      // Build items HTML with correct language
      const itemsHtml = (printData.items || []).map(item => {
        const productName = getProductName(item, language);
        return `
          <tr>
            <td>${productName}</td>
            <td>${item.quantity}</td>
            <td>₪${parseFloat(item.unitPrice).toFixed(2)}</td>
            <td>${item.discountPercent || 0}%</td>
            <td>₪${parseFloat(item.totalPrice).toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${direction}" lang="${language}">
        <head>
          <meta charset="UTF-8">
          <title>${pt.billTitle} #${printData.billNumber}</title>
          <style>
            body { font-family: ${fontFamily}; padding: 20px; direction: ${direction}; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #333; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info div { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: ${textAlign}; }
            th { background: #f5f5f5; }
            .totals { text-align: ${isRTL ? 'left' : 'right'}; margin-top: 20px; }
            .totals div { margin: 5px 0; }
            .total-row { font-size: 1.2em; font-weight: bold; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VinaShop</h1>
            <p>${pt.billTitle} #${printData.billNumber}</p>
          </div>
          <div class="info">
            <div>
              <strong>${pt.customer}:</strong><br>
              ${printData.customerName}<br>
              ${printData.customerPhone || ''}<br>
              ${printData.customerEmail || ''}
            </div>
            <div style="text-align: ${isRTL ? 'left' : 'right'};">
              <strong>${pt.date}:</strong> ${formatDate(printData.billDate)}<br>
              <strong>${pt.status}:</strong> ${statusText}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>${pt.description}</th>
                <th>${pt.qty}</th>
                <th>${pt.unitPrice}</th>
                <th>${pt.discount}</th>
                <th>${pt.total}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div>${pt.subtotal}: ₪${parseFloat(printData.subtotal).toFixed(2)}</div>
            ${printData.taxAmount > 0 ? `<div>${pt.tax}: ₪${parseFloat(printData.taxAmount).toFixed(2)}</div>` : ''}
            ${printData.discountAmount > 0 ? `<div>${pt.discount}: -₪${parseFloat(printData.discountAmount).toFixed(2)}</div>` : ''}
            <div class="total-row">${pt.total}: ₪${parseFloat(printData.totalAmount).toFixed(2)}</div>
            <div>${pt.amountPaid}: ₪${parseFloat(printData.amountPaid).toFixed(2)}</div>
            <div class="total-row">${pt.amountDue}: ₪${parseFloat(printData.amountDue).toFixed(2)}</div>
          </div>
          ${printData.notes ? `<p><strong>${pt.notes}:</strong> ${printData.notes}</p>` : ''}
          <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
      setShowPrintModal(false);
    } catch (error) {
      toast.error('Failed to print bill');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      bill_date: new Date().toISOString().split('T')[0],
      tax_amount: 0,
      discount_amount: 0,
      notes: '',
      items: []
    });
    setEditMode(false);
    setSelectedBill(null);
    setProductSearch('');
    setSearchResults([]);
    setShowOrderImport(false);
    setOrderSearch('');
    setOrderSearchResults([]);
    setManualItem({ description: '', quantity: 1, unit_price: 0, discount_percent: 0 });
  };

  const getStatusBadge = (status) => {
    const badges = {
      unpaid: 'badge-danger',
      partial: 'badge-warning',
      paid: 'badge-success'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('customerBills.title') || 'Customer Bills'}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <FiPlus /> {t('customerBills.createBill') || 'Create Bill'}
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder={t('app.search')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.payment_status}
          onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
        >
          <option value="">{t('app.all')} {t('app.status')}</option>
          <option value="unpaid">{t('customerBills.statuses.unpaid')}</option>
          <option value="partial">{t('customerBills.statuses.partial')}</option>
          <option value="paid">{t('customerBills.statuses.paid')}</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('customerBills.billNumber')}</th>
                <th>{t('customerBills.customer')}</th>
                <th>{t('app.date')}</th>
                <th>{t('customerBills.total')}</th>
                <th>{t('app.paid')}</th>
                <th>{t('app.due')}</th>
                <th>{t('app.status')}</th>
                <th>{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">{t('customerBills.noBills')}</td></tr>
              ) : (
                bills.map(bill => (
                  <tr key={bill.id || bill.billId}>
                    <td><strong>{bill.billNumber || bill.bill_number}</strong></td>
                    <td>
                      {bill.customerName || bill.customer_name}
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {bill.customerPhone || bill.customer_phone}
                      </div>
                    </td>
                    <td>{formatDate(bill.billDate || bill.bill_date)}</td>
                    <td><strong>₪{parseFloat(bill.totalAmount || bill.total_amount || 0).toFixed(2)}</strong></td>
                    <td style={{ color: '#22c55e' }}>₪{parseFloat(bill.amountPaid || bill.amount_paid || 0).toFixed(2)}</td>
                    <td style={{ color: '#ef4444' }}>₪{parseFloat(bill.amountDue || bill.amount_due || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(bill.paymentStatus || bill.payment_status)}`}>
                        {(bill.paymentStatus || bill.payment_status || '').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon view" onClick={() => viewBill(bill)} title="View">
                          <FiEye />
                        </button>
                        <button className="btn-icon edit" onClick={() => editBill(bill)} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button className="btn-icon" onClick={() => openPrintModal(bill)} title="Print" style={{ color: '#3b82f6' }}>
                          <FiPrinter />
                        </button>
                        {(bill.paymentStatus || bill.payment_status) !== 'paid' && (
                          <button className="btn-icon" onClick={() => openPaymentModal(bill)} title="Record Payment" style={{ color: '#22c55e' }}>
                            <FiDollarSign />
                          </button>
                        )}
                        <button className="btn-icon delete" onClick={() => handleDelete(bill.id || bill.billId)} title="Delete">
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

      {/* Create/Edit Bill Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>{editMode ? t('customerBills.editBill') : t('customerBills.createBill')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Import from Order Button */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: '#8b5cf6', color: 'white' }}
                    onClick={() => { setShowOrderImport(!showOrderImport); handleOrderSearch(''); }}
                  >
                    <FiShoppingCart /> {t('customerBills.importFromOrder') || 'Import from Order'}
                  </button>
                </div>

                {/* Order Import Section */}
                {showOrderImport && (
                  <div style={{
                    background: '#f1f5f9',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#64748b' }}>{t('customerBills.selectOrder') || 'Select Order to Import'}</h4>

                    {/* Dropdown Select for Recent Orders */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#475569' }}>
                        {t('customerBills.recentOrders') || 'Recent Orders'} ({orders.length})
                      </label>
                      <select
                        className="form-control"
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedOrder = orders.find(o => (o.order_id || o.orderId) == e.target.value);
                            if (selectedOrder) importFromOrder(selectedOrder);
                          }
                        }}
                        defaultValue=""
                        style={{ fontSize: '0.95em' }}
                      >
                        <option value="">{t('customerBills.selectOrderDropdown') || '-- Select an order --'}</option>
                        {orders.map(order => (
                          <option key={order.order_id || order.orderId} value={order.order_id || order.orderId}>
                            #{order.order_number || order.orderNumber} - {order.customer_name || order.customerName || 'Unknown'} - {formatDate(order.created_at || order.createdAt)} - ₪{parseFloat(order.total_amount || order.totalAmount || 0).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0', color: '#94a3b8' }}>
                      <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }}></div>
                      <span style={{ padding: '0 10px', fontSize: '0.85em' }}>{t('app.or') || 'OR'}</span>
                      <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }}></div>
                    </div>

                    {/* Search Orders */}
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#475569' }}>
                      {t('customerBills.searchOrders') || 'Search Orders'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('app.search') + ' ' + (t('orders.orderId') || 'Order ID') + '...'}
                      value={orderSearch}
                      onChange={(e) => handleOrderSearch(e.target.value)}
                      style={{ marginBottom: '10px' }}
                    />
                    {orderSearch.length > 0 && (
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {orderSearchResults.map(order => (
                          <div
                            key={order.order_id || order.orderId}
                            style={{
                              padding: '10px',
                              background: 'white',
                              borderRadius: '6px',
                              marginBottom: '5px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onClick={() => importFromOrder(order)}
                          >
                            <div>
                              <strong>#{order.order_number || order.orderNumber}</strong>
                              <div style={{ fontSize: '0.85em', color: '#64748b' }}>
                                {order.customer_name || order.customerName} - {formatDate(order.created_at || order.createdAt)}
                              </div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#22c55e' }}>
                              ₪{parseFloat(order.total_amount || order.totalAmount || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                        {orderSearchResults.length === 0 && (
                          <p style={{ color: '#64748b', textAlign: 'center', margin: '10px 0' }}>
                            {t('orders.noOrders') || 'No orders found'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  {/* Customer Name */}
                  <div className="form-group">
                    <label>{t('customerBills.customerName') || 'Customer Name'} *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('customerBills.enterCustomerName') || 'Enter customer name...'}
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>
                  {/* Customer Phone */}
                  <div className="form-group">
                    <label>{t('customerBills.customerPhone') || 'Phone Number'}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('customerBills.enterPhone') || 'Enter phone number...'}
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                  </div>
                  {/* Bill Date */}
                  <div className="form-group">
                    <label>{t('customerBills.billDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.bill_date}
                      onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Add Items Section */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                    {t('customerBills.addItem')}
                  </label>

                  {/* Search Products */}
                  <div style={{ position: 'relative', marginBottom: '15px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={(t('customerBills.searchProducts') || 'Search products') + '...'}
                      value={productSearch}
                      onChange={(e) => handleProductSearch(e.target.value)}
                    />
                    <FiSearch style={{ position: 'absolute', right: '15px', top: '12px', color: '#64748b' }} />
                    {searchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 10,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {searchResults.map(product => (
                          <div
                            key={product.product_id}
                            style={{
                              padding: '10px 15px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                            onClick={() => addProductToItems(product)}
                          >
                            <span>{product.name_en || product.product_name_en}</span>
                            <span style={{ color: '#64748b' }}>₪{parseFloat(product.price || product.base_price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Item Entry */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '15px'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.9em' }}>
                      {t('customerBills.orAddManually') || 'Or add item manually:'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.85em', color: '#64748b' }}>{t('customerBills.description')}</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={t('customerBills.itemDescription') || 'Item description...'}
                          value={manualItem.description}
                          onChange={(e) => setManualItem({ ...manualItem, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.85em', color: '#64748b' }}>{t('app.qty')}</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          value={manualItem.quantity}
                          onChange={(e) => setManualItem({ ...manualItem, quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.85em', color: '#64748b' }}>{t('app.price')}</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.01"
                          value={manualItem.unit_price}
                          onChange={(e) => setManualItem({ ...manualItem, unit_price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.85em', color: '#64748b' }}>{t('app.discount')} %</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="100"
                          value={manualItem.discount_percent}
                          onChange={(e) => setManualItem({ ...manualItem, discount_percent: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <button type="button" className="btn btn-primary" onClick={addManualItem}>
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                </div>

                {formData.items.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>{t('customerBills.description')}</th>
                          <th style={{ width: '80px' }}>{t('app.qty')}</th>
                          <th style={{ width: '100px' }}>{t('customerBills.unitPrice')}</th>
                          <th style={{ width: '80px' }}>{t('customerBills.discountPercent')}</th>
                          <th style={{ width: '100px' }}>{t('customerBills.total')}</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={item.quantity}
                                min="1"
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={item.unit_price}
                                min="0"
                                step="0.01"
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={item.discount_percent}
                                min="0"
                                max="100"
                                onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                              ₪{parseFloat(item.total_price || 0).toFixed(2)}
                            </td>
                            <td>
                              <button type="button" className="btn-icon delete" onClick={() => removeItem(index)}>
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('customerBills.taxAmount')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.tax_amount}
                      min="0"
                      step="0.01"
                      onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('customerBills.discountAmount')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.discount_amount}
                      min="0"
                      step="0.01"
                      onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('customerBills.notes')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('app.optional') + '...'}
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
                  <div style={{ marginBottom: '5px' }}>{t('customerBills.subtotal')}: <strong>₪{calculateSubtotal().toFixed(2)}</strong></div>
                  <div style={{ marginBottom: '5px' }}>{t('customerBills.tax')}: <strong>₪{parseFloat(formData.tax_amount || 0).toFixed(2)}</strong></div>
                  <div style={{ marginBottom: '5px' }}>{t('customerBills.discount')}: <strong>-₪{parseFloat(formData.discount_amount || 0).toFixed(2)}</strong></div>
                  <div style={{ fontSize: '1.2em', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    {t('customerBills.total')}: <strong>₪{calculateTotal().toFixed(2)}</strong>
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

      {/* View Bill Modal */}
      {showViewModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Bill #{selectedBill.billNumber || selectedBill.bill_number}</h3>
              <button className="btn-icon" onClick={() => setShowViewModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('customerBills.customer')}</h4>
                  <p><strong>{selectedBill.customerName || selectedBill.customer_name}</strong></p>
                  <p>{selectedBill.customerPhone || selectedBill.customer_phone}</p>
                  <p>{selectedBill.customerEmail || selectedBill.customer_email}</p>
                </div>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#64748b' }}>{t('customerBills.viewDetails')}</h4>
                  <p><strong>{t('app.date')}:</strong> {formatDate(selectedBill.billDate || selectedBill.bill_date)}</p>
                  <p><strong>{t('app.status')}:</strong> <span className={`badge ${getStatusBadge(selectedBill.paymentStatus || selectedBill.payment_status)}`}>{t('customerBills.statuses.' + (selectedBill.paymentStatus || selectedBill.payment_status || 'unpaid'))}</span></p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>{t('customerBills.description')}</th>
                    <th>{t('app.qty')}</th>
                    <th>{t('app.price')}</th>
                    <th>{t('app.discount')}</th>
                    <th>{t('customerBills.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBill.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description || item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>₪{parseFloat(item.unitPrice || item.unit_price || 0).toFixed(2)}</td>
                      <td>{item.discountPercent || item.discount_percent || 0}%</td>
                      <td>₪{parseFloat(item.totalPrice || item.total_price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right' }}>{t('customerBills.subtotal')}:</td>
                    <td><strong>₪{parseFloat(selectedBill.subtotal || 0).toFixed(2)}</strong></td>
                  </tr>
                  {parseFloat(selectedBill.taxAmount || selectedBill.tax_amount) > 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right' }}>{t('customerBills.tax')}:</td>
                      <td>₪{parseFloat(selectedBill.taxAmount || selectedBill.tax_amount).toFixed(2)}</td>
                    </tr>
                  )}
                  {parseFloat(selectedBill.discountAmount || selectedBill.discount_amount) > 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right' }}>{t('customerBills.discount')}:</td>
                      <td style={{ color: '#22c55e' }}>-₪{parseFloat(selectedBill.discountAmount || selectedBill.discount_amount).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right' }}><strong>{t('customerBills.total')}:</strong></td>
                    <td><strong>₪{parseFloat(selectedBill.totalAmount || selectedBill.total_amount || 0).toFixed(2)}</strong></td>
                  </tr>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right' }}>{t('customerBills.amountPaid')}:</td>
                    <td style={{ color: '#22c55e' }}>₪{parseFloat(selectedBill.amountPaid || selectedBill.amount_paid || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right' }}><strong>{t('customerBills.amountDue')}:</strong></td>
                    <td style={{ color: '#ef4444' }}><strong>₪{parseFloat(selectedBill.amountDue || selectedBill.amount_due || 0).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              {selectedBill.notes && (
                <p style={{ marginTop: '15px' }}><strong>{t('customerBills.notes')}:</strong> {selectedBill.notes}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>{t('app.close')}</button>
              <button className="btn" style={{ background: '#3b82f6', color: 'white' }} onClick={() => openPrintModal(selectedBill)}>
                <FiPrinter /> {t('customerBills.printBill')}
              </button>
              {(selectedBill.paymentStatus || selectedBill.payment_status) !== 'paid' && (
                <button className="btn btn-primary" onClick={() => { setShowViewModal(false); openPaymentModal(selectedBill); }}>
                  <FiDollarSign /> {t('customerBills.recordPayment')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('customerBills.recordPayment')} - {t('customerBills.billNumber')} #{selectedBill.billNumber || selectedBill.bill_number}</h3>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>{t('customerBills.totalAmount')}:</span>
                    <strong>₪{parseFloat(selectedBill.totalAmount || selectedBill.total_amount || 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>{t('customerBills.amountPaid')}:</span>
                    <span style={{ color: '#22c55e' }}>₪{parseFloat(selectedBill.amountPaid || selectedBill.amount_paid || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <strong>{t('customerBills.amountDue')}:</strong>
                    <strong style={{ color: '#ef4444' }}>₪{parseFloat(selectedBill.amountDue || selectedBill.amount_due || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('customerBills.paymentAmount')} *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentData.amount}
                    min="0.01"
                    step="0.01"
                    max={parseFloat(selectedBill.amountDue || selectedBill.amount_due || 0)}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('customerBills.paymentMethod')}</label>
                  <select
                    className="form-control"
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  >
                    <option value="cash">{t('customerBills.paymentMethods.cash')}</option>
                    <option value="card">{t('customerBills.paymentMethods.card')}</option>
                    <option value="bank_transfer">{t('customerBills.paymentMethods.bank_transfer')}</option>
                    <option value="other">{t('customerBills.paymentMethods.other')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('customerBills.notes')}</label>
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
                <button type="submit" className="btn btn-primary">{t('customerBills.recordPayment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Language Selection Modal */}
      {showPrintModal && billToPrint && (
        <div className="modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{t('customerBills.selectPrintLanguage') || 'Select Print Language'}</h3>
              <button className="btn-icon" onClick={() => setShowPrintModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className={`btn ${printLanguage === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPrintLanguage('en')}
                  style={{ justifyContent: 'flex-start', padding: '15px 20px' }}
                >
                  🇬🇧 English
                </button>
                <button
                  className={`btn ${printLanguage === 'ar' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPrintLanguage('ar')}
                  style={{ justifyContent: 'flex-start', padding: '15px 20px' }}
                >
                  🇵🇸 العربية (Arabic)
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>{t('app.cancel')}</button>
              <button
                className="btn btn-primary"
                onClick={() => printBill(billToPrint, printLanguage)}
              >
                <FiPrinter /> {t('customerBills.printBill') || 'Print Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBills;
