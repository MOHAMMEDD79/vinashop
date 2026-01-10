import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, getImageUrl, PLACEHOLDER_IMAGE } from '../../utils/constants';
import './CartDrawer.css';

const CartDrawer = () => {
  const { t, getLocalized, isRTL } = useLanguage();
  const { items, isOpen, isInitialized, closeCart, updateQuantity, removeItem, subtotal, itemCount } = useCart();

  // Don't render until cart is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeCart]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay ${isOpen ? 'open' : ''}`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            <FiShoppingBag />
            {t('cart.title')}
            {itemCount > 0 && (
              <span className="cart-count">({itemCount})</span>
            )}
          </h2>
          <button
            className="cart-close-btn"
            onClick={closeCart}
            aria-label={t('common.close')}
          >
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className="cart-drawer-content">
          {items.length === 0 ? (
            <div className="cart-empty">
              <FiShoppingBag className="empty-icon" />
              <p>{t('cart.empty')}</p>
              <Link
                to="/products"
                className="btn btn-primary"
                onClick={closeCart}
              >
                {t('cart.continueShopping')}
              </Link>
            </div>
          ) : (
            <ul className="cart-items">
              {items.map((item) => {
                // item.price already includes options from ProductDetailPage
                const itemPrice = item.discountPrice || item.price;

                return (
                  <li key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      <img
                        src={getImageUrl(item.image)}
                        alt={getLocalized(item, 'name')}
                        onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                      />
                    </div>
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">
                        {getLocalized(item, 'name')}
                      </h4>
                      {/* Legacy color/size options */}
                      {(item.selectedColorName || item.selectedSizeName) && (
                        <div className="cart-item-options">
                          {item.selectedColorHex && (
                            <span
                              className="color-dot"
                              style={{ backgroundColor: item.selectedColorHex }}
                            />
                          )}
                          {item.selectedSizeName && (
                            <span className="size-label">{item.selectedSizeName}</span>
                          )}
                        </div>
                      )}
                      {/* New options system */}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="cart-item-selected-options">
                          {item.selectedOptions.map((opt, idx) => (
                            <span key={idx} className="selected-option">
                              {opt.type_name}: {opt.value_name}
                              {opt.additional_price > 0 && (
                                <span className="option-extra"> (+{formatPrice(opt.additional_price)})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="cart-item-price">
                        <span className="price-current">
                          {formatPrice(itemPrice)}
                        </span>
                      </div>
                    </div>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <FiMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <FiPlus />
                      </button>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                      aria-label={t('cart.remove')}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal">
              <span>{t('cart.subtotal')}</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <Link
              to="/checkout"
              className="btn btn-primary btn-block btn-lg"
              onClick={closeCart}
            >
              {t('cart.checkout')}
            </Link>
            <Link
              to="/cart"
              className="btn btn-outline btn-block"
              onClick={closeCart}
            >
              {t('cart.title')}
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
