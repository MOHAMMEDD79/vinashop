import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheck, FiTruck } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { orderApi } from '../../services/api';
import { formatPrice, getImageUrl, DELIVERY_AREAS, validatePhone, PLACEHOLDER_IMAGE } from '../../utils/constants';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { t, getLocalized, isRTL, language } = useLanguage();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    deliveryArea: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Get delivery fee based on selected area
  const getDeliveryFee = () => {
    const area = Object.values(DELIVERY_AREAS).find(a => a.id === formData.deliveryArea);
    return area ? area.fee : 0;
  };

  const deliveryFee = getDeliveryFee();
  const total = subtotal + deliveryFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('validation.required');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.required');
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t('validation.invalidPhone');
    }

    if (!formData.address.trim()) {
      newErrors.address = t('validation.required');
    }

    if (!formData.deliveryArea) {
      newErrors.deliveryArea = t('validation.selectDeliveryArea');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save order to localStorage for "My Orders" page
  const saveOrderToLocalStorage = (orderData, orderId) => {
    try {
      const existingOrders = JSON.parse(localStorage.getItem('vinashop_orders') || '[]');
      const newOrder = {
        orderId: orderId,
        date: new Date().toISOString(),
        customerName: orderData.guest_name,
        phone: orderData.guest_phone,
        address: orderData.guest_address,
        deliveryArea: formData.deliveryArea,
        items: items.map(item => ({
          name: getLocalized(item, 'name'),
          quantity: item.quantity,
          price: item.discountPrice || item.price,
          image: item.image
        })),
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: total,
        status: 'pending'
      };
      existingOrders.unshift(newOrder);
      // Keep only last 50 orders
      localStorage.setItem('vinashop_orders', JSON.stringify(existingOrders.slice(0, 50)));
    } catch (error) {
      console.error('Error saving order to localStorage:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // Map frontend delivery area to backend region
      const regionMap = {
        'israel_48': 'other',
        'abu_ghosh': 'other',
        'jerusalem': 'jerusalem',
        'west_bank': 'west_bank'
      };

      const orderData = {
        guest_name: formData.fullName,
        guest_email: `${formData.phone}@guest.vinashop.com`, // Backend requires email
        guest_phone: formData.phone,
        guest_city: formData.address.split(',')[1]?.trim() || formData.address,
        guest_address: formData.address,
        guest_area_code: formData.deliveryArea,
        delivery_method: 'delivery',
        region: regionMap[formData.deliveryArea] || 'other',
        notes: formData.notes,
        items: items.map(item => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
          price: item.discountPrice || item.price,
          selected_options: item.selectedOptions || []
        })),
        subtotal,
        delivery_fee: deliveryFee,
        total
      };

      const response = await orderApi.create(orderData);
      const orderId = response.order?.order_id || response.data?.order_id || Date.now();

      // Save order to localStorage for "My Orders" page
      saveOrderToLocalStorage(orderData, orderId);

      // Clear cart and redirect to confirmation
      clearCart();
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Order error:', error);
      setErrors({ submit: error.message || 'Failed to place order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page empty">
        <div className="container">
          <div className="empty-checkout">
            <h2>{t('validation.cartEmpty')}</h2>
            <Link to="/products" className="btn btn-primary">
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">{t('checkout.title')}</h1>

        <form onSubmit={handleSubmit} className="checkout-layout">
          {/* Customer Info */}
          <div className="checkout-form">
            <section className="form-section">
              <h2>{t('checkout.customerInfo')}</h2>

              <div className="form-group">
                <label className="form-label">{t('checkout.fullName')} *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder={isRTL ? 'الاسم الكامل' : 'Enter your full name'}
                />
                {errors.fullName && <span className="form-error">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{t('checkout.phone')} *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
            </section>

            {/* Delivery Address Section */}
            <section className="form-section">
              <h2>
                <FiTruck className="section-icon" />
                {t('checkout.deliveryInfo')}
              </h2>

              <div className="form-group">
                <label className="form-label">{t('checkout.address')} *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`form-input ${errors.address ? 'error' : ''}`}
                  placeholder={isRTL ? 'الشارع، القرية، المدينة' : 'Street, Village, City'}
                />
                {errors.address && <span className="form-error">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{t('checkout.deliveryArea')} *</label>
                <p className="form-helper">
                  {isRTL ? 'اختاري منطقة التوصيل - السعر يشمل رسوم التوصيل' : 'Select delivery area - Price includes shipping fee'}
                </p>
                <div className="delivery-options">
                  {Object.values(DELIVERY_AREAS).map((area) => (
                    <label
                      key={area.id}
                      className={`delivery-option ${formData.deliveryArea === area.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="deliveryArea"
                        value={area.id}
                        checked={formData.deliveryArea === area.id}
                        onChange={handleChange}
                      />
                      <span className="option-content">
                        <span className="option-name">
                          {language === 'ar' ? area.nameAr : area.nameEn}
                        </span>
                        <span className="option-fee">
                          {formatPrice(area.fee)}
                        </span>
                      </span>
                      {formData.deliveryArea === area.id && <FiCheck className="check-icon" />}
                    </label>
                  ))}
                </div>
                {errors.deliveryArea && <span className="form-error">{errors.deliveryArea}</span>}
              </div>
            </section>

            {/* Notes Section */}
            <section className="form-section">
              <div className="form-group">
                <label className="form-label">{t('checkout.notes')}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder={t('checkout.notesPlaceholder')}
                  rows="3"
                />
              </div>
            </section>

            <div className="payment-info">
              <h3>{t('checkout.cashOnDelivery')}</h3>
              <p>{t('checkout.paymentNote')}</p>
            </div>

            {errors.submit && (
              <div className="submit-error">{errors.submit}</div>
            )}
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h2>{t('checkout.orderSummary')}</h2>

            <ul className="summary-items">
              {items.map((item) => (
                <li key={item.id} className="summary-item">
                  <div className="item-image">
                    <img
                      src={getImageUrl(item.image)}
                      alt={getLocalized(item, 'name')}
                      onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                    />
                    <span className="item-qty">{item.quantity}</span>
                  </div>
                  <div className="item-info">
                    <span className="item-name">{getLocalized(item, 'name')}</span>
                    {item.selectedSizeName && <span className="item-option">{item.selectedSizeName}</span>}
                  </div>
                  <span className="item-price">
                    {formatPrice((item.discountPrice || item.price) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="summary-totals">
              <div className="summary-row">
                <span>{t('checkout.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row delivery-row">
                <span>{t('checkout.delivery')}</span>
                <span className={deliveryFee > 0 ? 'has-fee' : ''}>
                  {deliveryFee > 0 ? formatPrice(deliveryFee) : (isRTL ? 'اختاري المنطقة' : 'Select area')}
                </span>
              </div>
              <div className="summary-row total-row">
                <span>{t('checkout.total')}</span>
                <span className="total-amount">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading || !formData.deliveryArea}
            >
              {loading ? t('checkout.processing') : t('checkout.placeOrder')}
              {!loading && <ArrowIcon />}
            </button>

            <p className="checkout-note">
              {isRTL
                ? 'الدفع عند الاستلام فقط - سنتواصل معك لتأكيد الطلب'
                : 'Cash on delivery only - We will contact you to confirm the order'
              }
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
