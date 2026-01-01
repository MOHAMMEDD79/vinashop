import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, getImageUrl, PLACEHOLDER_IMAGE } from '../../utils/constants';
import './CartPage.css';

const CartPage = () => {
  const { t, getLocalized, isRTL } = useLanguage();
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  if (items.length === 0) {
    return (
      <div className="cart-page empty">
        <div className="container">
          <div className="empty-cart">
            <FiShoppingBag className="empty-icon" />
            <h2>{t('cart.empty')}</h2>
            <Link to="/products" className="btn btn-primary btn-lg">
              {t('cart.continueShopping')}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">{t('cart.title')}</h1>

        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="cart-header">
              <span>{t('cart.item')}</span>
              <span>{t('cart.price')}</span>
              <span>{t('cart.quantity')}</span>
              <span>{t('cart.total')}</span>
              <span></span>
            </div>

            <ul className="cart-items-list">
              {items.map((item) => {
                const price = item.discountPrice || item.price;
                const itemTotal = price * item.quantity;

                return (
                  <li key={item.id} className="cart-item">
                    <div className="item-info">
                      <div className="item-image">
                        <img
                          src={getImageUrl(item.image)}
                          alt={getLocalized(item, 'name')}
                          onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                        />
                      </div>
                      <div className="item-details">
                        <h3>{getLocalized(item, 'name')}</h3>
                        {(item.selectedColorHex || item.selectedSizeName) && (
                          <div className="item-options">
                            {item.selectedColorHex && (
                              <span className="color-dot" style={{ backgroundColor: item.selectedColorHex }} />
                            )}
                            {item.selectedSizeName && <span>{item.selectedSizeName}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="item-price">
                      {item.discountPrice ? (
                        <>
                          <span className="current">{formatPrice(item.discountPrice)}</span>
                          <span className="original">{formatPrice(item.price)}</span>
                        </>
                      ) : (
                        <span className="current">{formatPrice(item.price)}</span>
                      )}
                    </div>

                    <div className="item-quantity">
                      <div className="quantity-control">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <FiMinus />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <FiPlus />
                        </button>
                      </div>
                    </div>

                    <div className="item-total">
                      {formatPrice(itemTotal)}
                    </div>

                    <button className="remove-btn" onClick={() => removeItem(item.id)}>
                      <FiTrash2 />
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="cart-actions">
              <Link to="/products" className="btn btn-outline">
                {t('cart.continueShopping')}
              </Link>
              <button className="btn btn-outline" onClick={clearCart} style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                {isRTL ? 'مسح السلة' : 'Clear Cart'}
              </button>
            </div>
          </div>

          <div className="cart-summary">
            <h3>{isRTL ? 'ملخص الطلب' : 'Order Summary'}</h3>
            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>{t('checkout.delivery')}</span>
              <span className="delivery-note">{isRTL ? 'يحدد عند الدفع' : 'Calculated at checkout'}</span>
            </div>
            <div className="summary-total">
              <span>{t('cart.total')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Link to="/checkout" className="btn btn-primary btn-lg btn-block">
              {t('cart.checkout')}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
