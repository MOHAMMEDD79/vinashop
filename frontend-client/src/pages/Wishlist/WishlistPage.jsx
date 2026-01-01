import { Link } from 'react-router-dom';
import { FiHeart, FiTrash2, FiShoppingCart, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, getImageUrl, PLACEHOLDER_IMAGE } from '../../utils/constants';
import './WishlistPage.css';

const WishlistPage = () => {
  const { isRTL, language, getLocalized } = useLanguage();
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();

  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  const handleAddToCart = (item) => {
    const cartItem = {
      product_id: item.product_id,
      name: getLocalized(item, 'name') || item.name_en,
      name_en: item.name_en,
      name_ar: item.name_ar,
      price: item.discount_percentage > 0
        ? item.price * (1 - item.discount_percentage / 100)
        : item.price,
      base_price: item.price,
      image: item.image,
      quantity: 1,
      sku: item.sku,
      selected_options: []
    };
    addItem(cartItem);
  };

  const getDiscountedPrice = (item) => {
    if (item.discount_percentage > 0) {
      return item.price * (1 - item.discount_percentage / 100);
    }
    return item.price;
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page empty">
        <div className="container">
          <div className="empty-wishlist">
            <div className="empty-icon">
              <FiHeart />
            </div>
            <h2>{isRTL ? 'قائمة الرغبات فارغة' : 'Your Wishlist is Empty'}</h2>
            <p>
              {isRTL
                ? 'لم تضيفي أي منتجات إلى قائمة الرغبات بعد. تصفحي منتجاتنا وأضيفي ما يعجبك!'
                : "You haven't added any products to your wishlist yet. Browse our products and add what you like!"}
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              {isRTL ? 'تصفحي المنتجات' : 'Browse Products'}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        {/* Page Header */}
        <div className="wishlist-header">
          <div className="header-content">
            <h1>
              <FiHeart className="header-icon" />
              {isRTL ? 'قائمة الرغبات' : 'My Wishlist'}
            </h1>
            <span className="item-count">
              {wishlistItems.length} {isRTL ? 'منتج' : wishlistItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {wishlistItems.length > 0 && (
            <button className="clear-btn" onClick={clearWishlist}>
              <FiTrash2 />
              {isRTL ? 'مسح الكل' : 'Clear All'}
            </button>
          )}
        </div>

        {/* Wishlist Grid */}
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div key={item.product_id} className="wishlist-card">
              {/* Remove Button */}
              <button
                className="remove-btn"
                onClick={() => removeFromWishlist(item.product_id)}
                aria-label={isRTL ? 'إزالة من القائمة' : 'Remove from wishlist'}
              >
                <FiTrash2 />
              </button>

              {/* Discount Badge */}
              {item.discount_percentage > 0 && (
                <span className="discount-badge">-{Math.round(item.discount_percentage)}%</span>
              )}

              {/* Product Image */}
              <Link to={`/products/${item.product_id}`} className="card-image">
                <img
                  src={getImageUrl(item.image)}
                  alt={getLocalized(item, 'name') || item.name_en}
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                />
              </Link>

              {/* Product Info */}
              <div className="card-content">
                <Link to={`/products/${item.product_id}`} className="product-name">
                  {getLocalized(item, 'name') || item.name_en}
                </Link>

                {/* Price */}
                <div className="product-price">
                  <span className="current-price">{formatPrice(getDiscountedPrice(item))}</span>
                  {item.discount_percentage > 0 && (
                    <span className="original-price">{formatPrice(item.price)}</span>
                  )}
                </div>

                {/* Stock Status */}
                <div className={`stock-status ${item.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {item.stock_quantity > 0
                    ? (isRTL ? 'متوفر' : 'In Stock')
                    : (isRTL ? 'غير متوفر' : 'Out of Stock')
                  }
                </div>

                {/* Add to Cart Button */}
                <button
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(item)}
                  disabled={item.stock_quantity <= 0}
                >
                  <FiShoppingCart />
                  {isRTL ? 'أضف للسلة' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="continue-shopping">
          <Link to="/products" className="btn btn-outline">
            {isRTL ? 'متابعة التسوق' : 'Continue Shopping'}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
