import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiClock, FiMapPin, FiPhone, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice, getImageUrl, DELIVERY_AREAS, PLACEHOLDER_IMAGE } from '../../utils/constants';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
  const { isRTL, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load orders from localStorage
  useEffect(() => {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('vinashop_orders') || '[]');
      setOrders(savedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  }, []);

  // Get delivery area name
  const getAreaName = (areaId) => {
    const area = Object.values(DELIVERY_AREAS).find(a => a.id === areaId);
    if (area) {
      return language === 'ar' ? area.nameAr : area.nameEn;
    }
    return areaId;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status label and color
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        labelAr: 'قيد الانتظار',
        labelEn: 'Pending',
        color: '#f59e0b'
      },
      confirmed: {
        labelAr: 'تم التأكيد',
        labelEn: 'Confirmed',
        color: '#3b82f6'
      },
      processing: {
        labelAr: 'قيد التجهيز',
        labelEn: 'Processing',
        color: '#8b5cf6'
      },
      shipped: {
        labelAr: 'تم الشحن',
        labelEn: 'Shipped',
        color: '#06b6d4'
      },
      delivered: {
        labelAr: 'تم التوصيل',
        labelEn: 'Delivered',
        color: '#10b981'
      },
      cancelled: {
        labelAr: 'ملغي',
        labelEn: 'Cancelled',
        color: '#ef4444'
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Clear all orders
  const clearAllOrders = () => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف جميع الطلبات؟' : 'Are you sure you want to delete all orders?')) {
      localStorage.removeItem('vinashop_orders');
      setOrders([]);
      setSelectedOrder(null);
    }
  };

  // Delete single order
  const deleteOrder = (orderId, e) => {
    e.stopPropagation();
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this order?')) {
      const updatedOrders = orders.filter(order => order.orderId !== orderId);
      localStorage.setItem('vinashop_orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(null);
      }
    }
  };

  if (orders.length === 0) {
    return (
      <div className="my-orders-page empty">
        <div className="container">
          <div className="empty-orders">
            <FiPackage className="empty-icon" />
            <h2>{isRTL ? 'لا توجد طلبات' : 'No Orders Yet'}</h2>
            <p>
              {isRTL
                ? 'لم تقومي بأي طلبات حتى الآن. ابدأي التسوق الآن!'
                : "You haven't placed any orders yet. Start shopping now!"
              }
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              <FiShoppingBag />
              {isRTL ? 'تسوقي الآن' : 'Shop Now'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>{isRTL ? 'طلباتي' : 'My Orders'}</h1>
          <button className="btn btn-outline btn-sm" onClick={clearAllOrders}>
            <FiTrash2 />
            {isRTL ? 'مسح الكل' : 'Clear All'}
          </button>
        </div>

        <div className="orders-layout">
          {/* Orders List */}
          <div className="orders-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div
                  key={order.orderId}
                  className={`order-card ${selectedOrder?.orderId === order.orderId ? 'active' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-card-header">
                    <span className="order-number">#{order.orderId}</span>
                    <span
                      className="order-status"
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      {isRTL ? statusInfo.labelAr : statusInfo.labelEn}
                    </span>
                  </div>

                  <div className="order-card-body">
                    <div className="order-date">
                      <FiClock />
                      {formatDate(order.date)}
                    </div>
                    <div className="order-items-preview">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="preview-item">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                          />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="preview-more">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <span className="order-total">{formatPrice(order.total)}</span>
                    <button
                      className="delete-btn"
                      onClick={(e) => deleteOrder(order.orderId, e)}
                      title={isRTL ? 'حذف' : 'Delete'}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Details */}
          <div className="order-details">
            {selectedOrder ? (
              <>
                <div className="details-header">
                  <h2>{isRTL ? 'تفاصيل الطلب' : 'Order Details'}</h2>
                  <span className="order-id">#{selectedOrder.orderId}</span>
                </div>

                <div className="details-section">
                  <h3>{isRTL ? 'معلومات التوصيل' : 'Delivery Info'}</h3>
                  <div className="info-item">
                    <FiPhone />
                    <span>{selectedOrder.phone}</span>
                  </div>
                  <div className="info-item">
                    <FiMapPin />
                    <span>{selectedOrder.address}</span>
                  </div>
                  <div className="info-item delivery-area">
                    <span className="area-label">{isRTL ? 'المنطقة:' : 'Area:'}</span>
                    <span>{getAreaName(selectedOrder.deliveryArea)}</span>
                  </div>
                </div>

                <div className="details-section">
                  <h3>{isRTL ? 'المنتجات' : 'Products'}</h3>
                  <div className="order-items-list-pro">
                    {selectedOrder.items.map((item, idx) => {
                      const optionsTotal = item.selectedOptions
                        ? item.selectedOptions.reduce((sum, opt) => sum + (parseFloat(opt.additional_price) || 0), 0)
                        : 0;

                      return (
                        <div key={idx} className="order-item-card">
                          {/* Product Header */}
                          <div className="item-header">
                            <div className="item-image">
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                              />
                              <span className="item-qty">{item.quantity}</span>
                            </div>
                            <div className="item-main">
                              <span className="item-name">{item.name}</span>
                              <span className="item-unit-price">
                                {item.quantity} × {formatPrice(item.price)}
                              </span>
                            </div>
                            <span className="item-total">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>

                          {/* Selected Options */}
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div className="item-options-box">
                              <div className="options-title">
                                {isRTL ? 'الخيارات المحددة' : 'Selected Options'}
                              </div>
                              <div className="options-list">
                                {item.selectedOptions.map((opt, optIdx) => (
                                  <div key={optIdx} className="option-row">
                                    <span className="option-label">
                                      <strong>{opt.type_name}:</strong> {opt.value_name}
                                    </span>
                                    <span className={`option-price ${opt.additional_price > 0 ? 'has-price' : ''}`}>
                                      {opt.additional_price > 0 ? `+${formatPrice(opt.additional_price)}` : formatPrice(0)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {optionsTotal > 0 && (
                                <div className="options-total">
                                  <span>{isRTL ? 'إجمالي الخيارات' : 'Options Total'}:</span>
                                  <span className="options-total-price">+{formatPrice(optionsTotal)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="details-section totals">
                  <div className="total-row">
                    <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="total-row">
                    <span>{isRTL ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
                    <span>{formatPrice(selectedOrder.deliveryFee)}</span>
                  </div>
                  <div className="total-row final">
                    <span>{isRTL ? 'المجموع الكلي' : 'Total'}</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="details-footer">
                  <p className="payment-note">
                    {isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                  </p>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <FiPackage />
                <p>{isRTL ? 'اختاري طلباً لعرض التفاصيل' : 'Select an order to view details'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrdersPage;
