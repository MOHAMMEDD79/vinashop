import { Link } from 'react-router-dom';
import { FiShoppingCart, FiEye } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, getImageUrl } from '../../utils/constants';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { t, getLocalized } = useLanguage();
  const { addItem } = useCart();

  const {
    product_id,
    slug,
    price,
    discount_price,
    primary_image,
    stock_quantity,
    is_featured,
    created_at
  } = product;

  const name = getLocalized(product, 'name');
  const isNew = created_at && (Date.now() - new Date(created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const hasDiscount = discount_price && discount_price < price;
  const discountPercent = hasDiscount ? Math.round((1 - discount_price / price) * 100) : 0;
  const isOutOfStock = stock_quantity <= 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addItem(product);
    }
  };

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <Link to={`/products/${slug || product_id}`} className="product-card-link">
        {/* Image */}
        <div className="product-card-image">
          <img
            src={getImageUrl(primary_image)}
            alt={name}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/images/placeholder.png';
            }}
          />

          {/* Badges */}
          <div className="product-badges">
            {hasDiscount && (
              <span className="badge badge-sale">-{discountPercent}%</span>
            )}
            {isNew && !hasDiscount && (
              <span className="badge badge-new">{t('common.new') || 'New'}</span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="product-actions">
            <button
              className="action-btn view-btn"
              aria-label="View product"
            >
              <FiEye />
            </button>
            {!isOutOfStock && (
              <button
                className="action-btn cart-btn"
                onClick={handleQuickAdd}
                aria-label={t('product.addToCart')}
              >
                <FiShoppingCart />
              </button>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="out-of-stock-overlay">
              <span>{t('product.outOfStock')}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-card-info">
          <h3 className="product-name">{name}</h3>
          <div className="product-price">
            {hasDiscount ? (
              <>
                <span className="price-current">{formatPrice(discount_price)}</span>
                <span className="price-original">{formatPrice(price)}</span>
              </>
            ) : (
              <span className="price-current">{formatPrice(price)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
