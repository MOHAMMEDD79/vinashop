import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiMinus, FiPlus, FiShoppingCart, FiHeart, FiShare2,
  FiStar, FiCheck, FiTruck, FiShield, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiMaximize2
} from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { productApi } from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';
import ImageLightbox from '../../components/common/ImageLightbox';
import { formatPrice, getImageUrl } from '../../utils/constants';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { t, getLocalized, isRTL, language } = useLanguage();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [addedToCart, setAddedToCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setSelectedOptions({});
      setQuantity(1);
      setSelectedImage(0);
      setAddedToCart(false);

      try {
        const response = await productApi.getById(id, language);
        setProduct(response.product);

        // Fetch related products
        const relatedRes = await productApi.getSimilar(id, 4, language);
        setRelatedProducts(relatedRes.products || []);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, language]);

  // Get product stock
  const getStock = () => {
    return product?.stock_quantity || 0;
  };

  // Calculate total price with options
  const calculateTotalPrice = () => {
    if (!product) return 0;

    let total = parseFloat(product.base_price) || parseFloat(product.price) || 0;

    // Apply discount
    if (product.discount_percentage > 0) {
      total = total * (1 - product.discount_percentage / 100);
    }

    // Add option prices
    Object.values(selectedOptions).forEach(option => {
      if (option?.additional_price) {
        total += parseFloat(option.additional_price);
      }
    });

    return total * quantity;
  };

  const getUnitPrice = () => {
    if (!product) return 0;

    let price = parseFloat(product.base_price) || parseFloat(product.price) || 0;

    if (product.discount_percentage > 0) {
      price = price * (1 - product.discount_percentage / 100);
    }

    Object.values(selectedOptions).forEach(option => {
      if (option?.additional_price) {
        price += parseFloat(option.additional_price);
      }
    });

    return price;
  };

  const handleOptionSelect = (optionTypeId, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionTypeId]: value
    }));
  };

  const handleAddToCart = () => {
    const stock = getStock();
    if (!product || stock <= 0) return;

    // Check if all required options are selected
    const requiredOptions = product.options?.filter(opt => opt.is_required) || [];
    const missingRequired = requiredOptions.some(opt => !selectedOptions[opt.option_type_id]);

    if (missingRequired) {
      alert(language === 'ar' ? 'يرجى اختيار جميع الخيارات المطلوبة' : 'Please select all required options');
      return;
    }

    // Get the primary image URL - check multiple sources
    const productImage = product.images?.[0]?.image_url ||
                         product.image_url ||
                         product.primary_image ||
                         null;

    const cartItem = {
      product_id: product.product_id,
      name: getLocalized(product, 'name') || product.product_name_en,
      name_en: product.product_name_en,
      name_ar: product.product_name_ar,
      price: getUnitPrice(),
      base_price: product.base_price,
      image: productImage,
      quantity: quantity,
      sku: product.sku,
      selected_options: Object.entries(selectedOptions).map(([typeId, value]) => ({
        option_type_id: parseInt(typeId),
        option_value_id: value.option_value_id,
        type_name: product.options?.find(o => o.option_type_id === parseInt(typeId))?.type_name,
        value_name: value.value_name,
        additional_price: value.additional_price
      }))
    };

    addItem(cartItem);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleImageNav = (direction) => {
    const images = product?.images || [];
    if (direction === 'next') {
      setSelectedImage((prev) => (prev + 1) % images.length);
    } else {
      setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <FiStar
        key={star}
        className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
      />
    ));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) {
      alert(language === 'ar' ? 'يرجى اختيار تقييم' : 'Please select a rating');
      return;
    }
    if (!reviewText.trim() || reviewText.trim().length < 10) {
      alert(language === 'ar' ? 'يرجى كتابة تعليق (10 أحرف على الأقل)' : 'Please write a review (at least 10 characters)');
      return;
    }
    if (!reviewerName.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال اسمك' : 'Please enter your name');
      return;
    }

    setSubmittingReview(true);
    try {
      await productApi.submitReview(product.product_id, {
        rating: reviewRating,
        review_text: reviewText,
        reviewer_name: reviewerName.trim()
      });

      // Refresh product to get new reviews
      const response = await productApi.getById(id, language);
      setProduct(response.product);

      // Reset form
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewText('');
      setReviewerName('');
      alert(language === 'ar' ? 'تم إرسال تقييمك بنجاح! سيظهر بعد المراجعة.' : 'Your review has been submitted! It will appear after moderation.');
    } catch (error) {
      console.error('Review submission error:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إرسال التقييم' : 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loading />;

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="container">
          <h2>{language === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}</h2>
          <Link to="/products" className="btn btn-primary">
            {language === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [{ image_url: product.primary_image }];
  const hasDiscount = product.discount_percentage > 0;
  const originalPrice = parseFloat(product.base_price) || parseFloat(product.price) || 0;
  const discountedPrice = hasDiscount ? originalPrice * (1 - product.discount_percentage / 100) : originalPrice;
  const stock = getStock();

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="separator">/</span>
          <Link to="/products">{t('nav.products')}</Link>
          {product.category_name && (
            <>
              <span className="separator">/</span>
              <Link to={`/category/${product.category_id}`}>{product.category_name}</Link>
            </>
          )}
          <span className="separator">/</span>
          <span className="current">{getLocalized(product, 'name') || product.product_name_en}</span>
        </nav>

        <div className="product-detail-content">
          {/* Product Images */}
          <div className="product-gallery">
            <div className="main-image-container">
              {images.length > 1 && (
                <button className="nav-btn prev" onClick={() => handleImageNav('prev')}>
                  <FiChevronLeft />
                </button>
              )}

              <div className="main-image" onClick={() => setLightboxOpen(true)}>
                <img
                  src={getImageUrl(images[selectedImage]?.image_url)}
                  alt={getLocalized(product, 'name')}
                />
                {hasDiscount && (
                  <span className="discount-badge">-{Math.round(product.discount_percentage)}%</span>
                )}
                {product.is_new && (
                  <span className="new-badge">{language === 'ar' ? 'جديد' : 'NEW'}</span>
                )}
                <button
                  className="fullscreen-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxOpen(true);
                  }}
                  aria-label={language === 'ar' ? 'عرض بالحجم الكامل' : 'View fullscreen'}
                >
                  <FiMaximize2 />
                </button>
              </div>

              {images.length > 1 && (
                <button className="nav-btn next" onClick={() => handleImageNav('next')}>
                  <FiChevronRight />
                </button>
              )}
            </div>

            {images.length > 1 && (
              <div className="thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={getImageUrl(img.image_url)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            {/* Category */}
            {product.category_name && (
              <Link to={`/category/${product.category_id}`} className="product-category">
                {product.category_name}
              </Link>
            )}

            {/* Title */}
            <h1 className="product-title">{getLocalized(product, 'name') || product.product_name_en}</h1>

            {/* Rating */}
            <div className="product-rating">
              <div className="stars">{renderStars(product.average_rating || product.rating_average || 0)}</div>
              <span className="rating-count">
                ({product.rating_count || product.review_count || 0} {language === 'ar' ? 'تقييم' : 'reviews'})
              </span>
              {product.sku && <span className="sku">SKU: {product.sku}</span>}
            </div>

            {/* Price */}
            <div className="product-price">
              <span className="current-price">{formatPrice(discountedPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="original-price">{formatPrice(originalPrice)}</span>
                  <span className="save-amount">
                    {language === 'ar' ? 'وفر' : 'Save'} {formatPrice(originalPrice - discountedPrice)}
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="product-short-desc">
                {(getLocalized(product, 'description') || product.product_description_en || '').substring(0, 200)}
                {(product.description?.length > 200) && '...'}
              </p>
            )}

            {/* Product Options */}
            {product.options?.length > 0 && (
              <div className="product-options">
                {product.options.map((option) => (
                  <div key={option.option_type_id} className="option-group">
                    <label className="option-label">
                      {option.type_name || option.type_name_en}
                      {option.is_required === 1 && <span className="required">*</span>}
                    </label>
                    <div className="option-values">
                      {option.values?.map((value) => (
                        <button
                          key={value.option_value_id}
                          className={`option-btn ${
                            selectedOptions[option.option_type_id]?.option_value_id === value.option_value_id
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() => handleOptionSelect(option.option_type_id, value)}
                        >
                          <span className="value-name">{value.value_name || value.value_name_en}</span>
                          {Number(value.additional_price) > 0 && (
                            <span className="extra-price">+{formatPrice(value.additional_price)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="quantity-section">
              <label className="option-label">{language === 'ar' ? 'الكمية' : 'Quantity'}</label>
              <div className="quantity-controls">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <FiMinus />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={stock}
                />
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock}
                >
                  <FiPlus />
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="total-price">
              <span className="label">{language === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
              <span className="amount">{formatPrice(calculateTotalPrice())}</span>
            </div>

            {/* ADD TO CART BUTTON - Main Action */}
            <button
              className="add-to-cart-main-btn"
              onClick={handleAddToCart}
              disabled={stock <= 0}
              style={{
                width: '100%',
                padding: '18px 32px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: addedToCart ? '#28a745' : (stock <= 0 ? '#ccc' : '#c9a227'),
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: stock <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '20px',
                marginBottom: '10px'
              }}
            >
              {addedToCart ? (
                <>
                  <FiCheck size={22} />
                  {language === 'ar' ? 'تمت الإضافة للسلة!' : 'Added to Cart!'}
                </>
              ) : (
                <>
                  <FiShoppingCart size={22} />
                  {language === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
                </>
              )}
            </button>

            {/* ADD TO WISHLIST BUTTON */}
            <button
              onClick={() => toggleWishlist(product)}
              style={{
                width: '100%',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: isInWishlist(product.product_id) ? '#fef2f2' : 'transparent',
                color: isInWishlist(product.product_id) ? '#ef4444' : '#374151',
                border: isInWishlist(product.product_id) ? '2px solid #ef4444' : '2px solid #d1d5db',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '20px',
                transition: 'all 0.3s ease'
              }}
            >
              <FiHeart
                size={20}
                style={{
                  fill: isInWishlist(product.product_id) ? '#ef4444' : 'none',
                  color: isInWishlist(product.product_id) ? '#ef4444' : '#374151'
                }}
              />
              {isInWishlist(product.product_id)
                ? (language === 'ar' ? 'في قائمة الرغبات' : 'In Wishlist')
                : (language === 'ar' ? 'أضف لقائمة الرغبات' : 'Add to Wishlist')
              }
            </button>

            {/* Stock Status */}
            <div className={`stock-status ${stock > 0 ? (stock <= 10 ? 'low-stock' : 'in-stock') : 'out-of-stock'}`}>
              {stock > 0 ? (
                <>
                  <FiCheck />
                  <span>
                    {language === 'ar' ? 'متوفر في المخزون' : 'In Stock'}
                    {' - '}
                    <strong>{stock}</strong>
                    {' '}
                    {language === 'ar' ? 'قطعة متاحة' : 'items available'}
                    {stock <= 10 && (
                      <span className="low-stock-warning">
                        {' '}{language === 'ar' ? '(أسرع قبل النفاذ!)' : '(Hurry, low stock!)'}
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <span>{language === 'ar' ? 'غير متوفر حالياً' : 'Out of Stock'}</span>
              )}
            </div>

            {/* Wishlist & Share Buttons */}
            <div className="product-actions">
              <button
                className={`btn btn-secondary btn-wishlist ${isInWishlist(product.product_id) ? 'active' : ''}`}
                onClick={() => toggleWishlist(product)}
              >
                <FiHeart style={{ fill: isInWishlist(product.product_id) ? '#ef4444' : 'none', color: isInWishlist(product.product_id) ? '#ef4444' : 'currentColor' }} />
                <span>
                  {isInWishlist(product.product_id)
                    ? (language === 'ar' ? 'في المفضلة' : 'In Wishlist')
                    : (language === 'ar' ? 'أضف للمفضلة' : 'Add to Wishlist')
                  }
                </span>
              </button>
              <button
                className="btn btn-secondary btn-share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: getLocalized(product, 'name') || product.product_name_en,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert(language === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
                  }
                }}
              >
                <FiShare2 />
                <span>{language === 'ar' ? 'مشاركة' : 'Share'}</span>
              </button>
            </div>

            {/* Features */}
            <div className="product-features">
              <div className="feature">
                <FiTruck />
                <span>{language === 'ar' ? 'شحن سريع' : 'Fast Delivery'}</span>
              </div>
              <div className="feature">
                <FiShield />
                <span>{language === 'ar' ? 'ضمان الجودة' : 'Quality Guarantee'}</span>
              </div>
              <div className="feature">
                <FiRefreshCw />
                <span>{language === 'ar' ? 'إرجاع سهل' : 'Easy Returns'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="product-tabs">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              {language === 'ar' ? 'الوصف' : 'Description'}
            </button>
            <button
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              {language === 'ar' ? 'التقييمات' : 'Reviews'} ({product.reviews?.length || 0})
            </button>
          </div>

          <div className="tabs-content">
            {activeTab === 'description' && (
              <div className="tab-pane description-tab">
                <p>{getLocalized(product, 'description') || product.product_description_en || (language === 'ar' ? 'لا يوجد وصف متاح' : 'No description available')}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="tab-pane reviews-tab">
                {/* Write Review Button */}
                <div className="write-review-section">
                  {!showReviewForm ? (
                    <button
                      className="btn btn-primary write-review-btn"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <FiStar />
                      {language === 'ar' ? 'اكتب تقييمك' : 'Write a Review'}
                    </button>
                  ) : (
                    <form className="review-form" onSubmit={handleSubmitReview}>
                      <h4>{language === 'ar' ? 'شاركنا رأيك' : 'Share Your Experience'}</h4>

                      {/* Name Input */}
                      <div className="review-input">
                        <label>{language === 'ar' ? 'اسمك:' : 'Your Name:'}</label>
                        <input
                          type="text"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                          required
                        />
                      </div>

                      {/* Rating Selection */}
                      <div className="rating-select">
                        <label>{language === 'ar' ? 'تقييمك:' : 'Your Rating:'}</label>
                        <div className="star-select">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${star <= reviewRating ? 'selected' : ''}`}
                              onClick={() => setReviewRating(star)}
                            >
                              <FiStar />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="review-textarea">
                        <label>{language === 'ar' ? 'تعليقك:' : 'Your Review:'}</label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder={language === 'ar' ? 'اكتب تجربتك مع المنتج (10 أحرف على الأقل)...' : 'Write your experience with this product (at least 10 characters)...'}
                          rows={4}
                          required
                        />
                      </div>

                      {/* Form Actions */}
                      <div className="review-form-actions">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submittingReview}
                        >
                          {submittingReview
                            ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                            : (language === 'ar' ? 'إرسال التقييم' : 'Submit Review')
                          }
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowReviewForm(false);
                            setReviewRating(0);
                            setReviewText('');
                            setReviewerName('');
                          }}
                        >
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Reviews List */}
                {product.reviews?.length > 0 ? (
                  <div className="reviews-list">
                    {product.reviews.map((review) => (
                      <div key={review.review_id} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <span className="reviewer-name">
                              {review.reviewer_name || (language === 'ar' ? 'مستخدم' : 'User')}
                            </span>
                            <div className="review-stars">{renderStars(review.rating)}</div>
                          </div>
                          <span className="review-date">
                            {new Date(review.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>
                        <p className="review-text">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-reviews">
                    <p>{language === 'ar' ? 'لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!' : 'No reviews yet. Be the first to review this product!'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-products">
            <h2>{language === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}</h2>
            <div className="products-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        currentIndex={selectedImage}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        getImageUrl={getImageUrl}
      />
    </div>
  );
};

export default ProductDetailPage;
