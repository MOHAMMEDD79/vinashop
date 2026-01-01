import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft, FiChevronLeft, FiChevronRight, FiTruck, FiShield, FiDollarSign, FiHeadphones } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { productApi, categoryApi, bannerApi } from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';
import { getImageUrl, API_BASE_URL } from '../../utils/constants';
import './HomePage.css';

const HomePage = () => {
  const { t, getLocalized, isRTL, language } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  // Default banners if none from API
  const defaultBanners = [
    {
      id: 1,
      title: isRTL ? 'مرحباً بكم في VinaShop' : 'Welcome to VinaShop',
      subtitle: isRTL ? 'اكتشفي أحدث صيحات الشنط والإكسسوارات' : 'Discover the Latest Bag & Accessories',
      buttonText: isRTL ? 'تسوقي الآن' : 'Shop Now',
      buttonLink: '/products',
      image: '/images/banner1.jpg',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 2,
      title: isRTL ? 'تخفيضات موسمية' : 'Seasonal Sale',
      subtitle: isRTL ? 'خصومات تصل إلى 50% على منتجات مختارة' : 'Up to 50% off on selected items',
      buttonText: isRTL ? 'اكتشفي العروض' : 'Explore Deals',
      buttonLink: '/products?sale=true',
      image: '/images/banner2.jpg',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 3,
      title: isRTL ? 'وصل حديثاً' : 'New Arrivals',
      subtitle: isRTL ? 'تشكيلة جديدة من أرقى المنتجات' : 'Fresh collection of premium products',
      buttonText: isRTL ? 'شاهدي الجديد' : 'View New',
      buttonLink: '/products?sort=newest',
      image: '/images/banner3.jpg',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newArrivalsRes, categoriesRes, bannersRes] = await Promise.allSettled([
          productApi.getFeatured(8, language),
          productApi.getNewArrivals(8, language),
          categoryApi.getAll(language),
          bannerApi.getAll(language)
        ]);

        if (featuredRes.status === 'fulfilled') {
          setFeaturedProducts(featuredRes.value.data || featuredRes.value.products || []);
        }
        if (newArrivalsRes.status === 'fulfilled') {
          setNewArrivals(newArrivalsRes.value.data || newArrivalsRes.value.products || []);
        }
        if (categoriesRes.status === 'fulfilled') {
          const cats = categoriesRes.value.data || categoriesRes.value.categories || [];
          setCategories(Array.isArray(cats) ? cats : []);
        }

        // Handle banners from database
        if (bannersRes.status === 'fulfilled') {
          const bannerData = bannersRes.value.banners || bannersRes.value.data || bannersRes.value || [];
          if (Array.isArray(bannerData) && bannerData.length > 0) {
            // Map banner data to expected format
            const mappedBanners = bannerData.map(banner => ({
              id: banner.id || banner.banner_id,
              title: banner.title || (isRTL ? banner.title_ar : banner.title_en),
              subtitle: banner.subtitle || banner.description || (isRTL ? banner.subtitle_ar : banner.subtitle_en),
              image: banner.image || banner.media_url,
              video: banner.video,
              media_url: banner.media_url,
              media_type: banner.media_type || 'image',
              buttonText: isRTL ? 'تسوقي الآن' : 'Shop Now',
              buttonLink: banner.link_url || '/products',
              link_type: banner.link_type
            }));
            setBanners(mappedBanners);
          }
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language, isRTL]);

  // Auto-slide for banners
  useEffect(() => {
    const displayBanners = banners.length > 0 ? banners : defaultBanners;
    if (displayBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners]);

  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;
  const PrevIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const NextIcon = isRTL ? FiChevronLeft : FiChevronRight;

  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="home-page">
      {/* Hero Slider */}
      <section className="hero-slider" ref={sliderRef}>
        <div className="slider-container">
          {displayBanners.map((banner, index) => {
            // Handle media - could be image or video
            const isVideo = banner.media_type === 'video' || !!banner.video;
            const mediaUrl = isVideo ? banner.video : (banner.image || banner.media_url);
            const hasMedia = mediaUrl && mediaUrl.length > 0;

            // Determine the final URL
            let finalMediaUrl = null;
            if (hasMedia) {
              if (mediaUrl.startsWith('data:') || mediaUrl.startsWith('http')) {
                // Base64 data URL or external URL - use as is
                finalMediaUrl = mediaUrl;
              } else if (mediaUrl.startsWith('/api/')) {
                // API endpoint URL - prepend base URL
                finalMediaUrl = `${API_BASE_URL}${mediaUrl}`;
              } else {
                finalMediaUrl = getImageUrl(mediaUrl);
              }
            }

            return (
              <div
                key={banner.id || index}
                className={`slide ${index === currentSlide ? 'active' : ''}`}
                style={
                  !isVideo && finalMediaUrl
                    ? { backgroundImage: `url(${finalMediaUrl})` }
                    : finalMediaUrl
                    ? {} // Video - no background needed
                    : { background: banner.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
                }
              >
                {/* Video Background */}
                {isVideo && finalMediaUrl && (
                  <video
                    className="slide-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={finalMediaUrl}
                  />
                )}
                <div className="slide-overlay" />
                <div className="container">
                  <div className="slide-content">
                    <h1 className="slide-title">{banner.title}</h1>
                    <p className="slide-subtitle">{banner.subtitle || banner.description}</p>
                    <Link to={banner.buttonLink || banner.link_url || '/products'} className="btn btn-primary btn-lg slide-btn">
                      {banner.buttonText || (isRTL ? 'تسوقي الآن' : 'Shop Now')}
                      <ArrowIcon />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {displayBanners.length > 1 && (
          <>
            <button className="slider-nav prev" onClick={prevSlide} aria-label="Previous">
              <PrevIcon />
            </button>
            <button className="slider-nav next" onClick={nextSlide} aria-label="Next">
              <NextIcon />
            </button>
            <div className="slider-dots">
              {displayBanners.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Features Bar */}
      <section className="features-bar">
        <div className="container">
          <div className="features-bar-grid">
            <div className="feature-bar-item">
              <div className="feature-bar-icon icon-small">
                <FiTruck />
              </div>
              <div className="feature-bar-text">
                <h4>{isRTL ? 'توصيل سريع' : 'Fast Delivery'}</h4>
                <p>{isRTL ? 'لجميع مناطق فلسطين' : 'To all Palestine areas'}</p>
              </div>
            </div>
            <div className="feature-bar-item">
              <div className="feature-bar-icon">
                <FiShield />
              </div>
              <div className="feature-bar-text">
                <h4>{isRTL ? 'منتجات فاخرة' : 'Premium Products'}</h4>
                <p>{isRTL ? 'جودة مضمونة 100%' : '100% Quality Guaranteed'}</p>
              </div>
            </div>
            <div className="feature-bar-item">
              <div className="feature-bar-icon">
                <FiDollarSign />
              </div>
              <div className="feature-bar-text">
                <h4>{isRTL ? 'دفع عند الاستلام' : 'Cash on Delivery'}</h4>
                <p>{isRTL ? 'ادفعي عند الاستلام' : 'Pay when you receive'}</p>
              </div>
            </div>
            <div className="feature-bar-item">
              <div className="feature-bar-icon">
                <FiHeadphones />
              </div>
              <div className="feature-bar-text">
                <h4>{isRTL ? 'دعم متواصل' : '24/7 Support'}</h4>
                <p>{isRTL ? 'نحن هنا لمساعدتك' : 'We are here to help'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="section categories-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-content">
                <span className="section-badge">{isRTL ? 'الأصناف' : 'Categories'}</span>
                <h2 className="section-title">{isRTL ? 'تسوقي حسب الصنف' : 'Shop by Category'}</h2>
              </div>
              <Link to="/categories" className="view-all-link">
                {isRTL ? 'عرض الكل' : 'View All'}
                <ArrowIcon />
              </Link>
            </div>
            <div className="categories-grid">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.category_id}
                  to={`/category/${category.category_id}`}
                  className="category-card"
                >
                  <div className="category-image-wrapper">
                    {category.image_url || category.category_image ? (
                      <img
                        src={getImageUrl(category.image_url || category.category_image)}
                        alt={getLocalized(category, 'name') || category.category_name_en}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}
                    <div className="category-overlay">
                      <span className="category-explore">
                        {isRTL ? 'استكشفي' : 'Explore'}
                        <ArrowIcon />
                      </span>
                    </div>
                  </div>
                  <div className="category-info">
                    <h3 className="category-name">
                      {getLocalized(category, 'name') || category.category_name_en}
                    </h3>
                    {category.product_count > 0 && (
                      <span className="category-count">
                        {category.product_count} {isRTL ? 'منتج' : 'Products'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="section featured-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-content">
                <span className="section-badge">{isRTL ? 'منتجات مميزة' : 'Featured'}</span>
                <h2 className="section-title">{isRTL ? 'الأكثر مبيعاً' : 'Best Sellers'}</h2>
              </div>
              <Link to="/products?featured=true" className="view-all-link">
                {isRTL ? 'عرض الكل' : 'View All'}
                <ArrowIcon />
              </Link>
            </div>
            <div className="products-grid">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="section new-arrivals-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-content">
                <span className="section-badge">{isRTL ? 'جديد' : 'New'}</span>
                <h2 className="section-title">{isRTL ? 'وصل حديثاً' : 'New Arrivals'}</h2>
              </div>
              <Link to="/products?sort=newest" className="view-all-link">
                {isRTL ? 'عرض الكل' : 'View All'}
                <ArrowIcon />
              </Link>
            </div>
            <div className="products-grid">
              {newArrivals.slice(0, 8).map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instagram Section */}
      <section className="instagram-section">
        <div className="container">
          <div className="instagram-header">
            <span className="section-badge">{isRTL ? 'تابعينا' : 'Follow Us'}</span>
            <h2 className="section-title">{isRTL ? 'تابعينا على انستغرام' : 'Follow Us on Instagram'}</h2>
            <p className="instagram-handle">@vina_shop.ps</p>
          </div>
          <div className="instagram-cta">
            <a
              href="https://www.instagram.com/vina_shop.ps/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-lg"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              {isRTL ? 'تابعينا' : 'Follow Us'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
