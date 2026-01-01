import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiSearch, FiMenu, FiX, FiGlobe, FiHeart, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { categoryApi } from '../../services/api';
import './Header.css';

const Header = () => {
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll(language);
        setCategories(data.categories || data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [language]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowCategoriesDropdown(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const announcements = [
    isRTL ? 'كل قطعة مختارة بعناية ✨' : '✨ Every piece is carefully selected',
    isRTL ? 'اختياراتنا بتشبه ذوقك 💫' : '💫 Our selections match your taste',
    isRTL ? 'تسوّقي أكثر… وخلي الهدية علينا 🎁' : '🎁 Shop more... and the gift is on us'
  ];

  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/products', label: t('nav.products') },
    { to: '/my-orders', label: isRTL ? 'طلباتي' : 'My Orders' },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') }
  ];

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      {/* Top Bar */}
      <div className="header-top">
        <div className="container">
          <div className="header-top-content">
            <div className="announcements-wrapper">
              <span className="announcement-text" key={currentAnnouncement}>
                {announcements[currentAnnouncement]}
              </span>
            </div>
            <div className="header-top-right">
              <button
                className="language-toggle"
                onClick={toggleLanguage}
                aria-label="Toggle language"
              >
                <FiGlobe />
                <span>{language === 'en' ? 'العربية' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="header-main">
        <div className="container">
          <div className="header-content">
            {/* Mobile Menu Toggle */}
            <button
              className="menu-toggle mobile-only"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Logo */}
            <Link to="/" className="header-logo">
              <img
                src="/images/logo.png"
                alt="VinaShop"
                className="logo-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="logo-text-wrapper" dir="ltr">
                <span className="logo-text">Vina</span>
                <span className="logo-space">&nbsp;</span>
                <span className="logo-accent">Shop</span>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form className="header-search desktop-only" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder={isRTL ? 'ابحثي عن المنتجات...' : 'Search for products...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <FiSearch />
              </button>
            </form>

            {/* Actions */}
            <div className="header-actions">
              <button
                className="action-btn wishlist-btn desktop-only"
                onClick={() => navigate('/wishlist')}
                aria-label="Wishlist"
              >
                <FiHeart />
                {wishlistCount > 0 && (
                  <span className="wishlist-badge">{wishlistCount}</span>
                )}
              </button>

              <button
                className="action-btn cart-btn"
                onClick={openCart}
                aria-label={t('nav.cart')}
              >
                <FiShoppingCart />
                {itemCount > 0 && (
                  <span className="cart-badge">{itemCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
        <div className="container">
          <ul className="nav-list">
            {navLinks.slice(0, 1).map((link) => (
              <li key={link.to} className="nav-item">
                <Link
                  to={link.to}
                  className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Categories Dropdown */}
            <li
              className="nav-item has-dropdown"
              onMouseEnter={() => setShowCategoriesDropdown(true)}
              onMouseLeave={() => setShowCategoriesDropdown(false)}
            >
              <Link
                to="/categories"
                className={`nav-link ${location.pathname.includes('/category') || location.pathname === '/categories' ? 'active' : ''}`}
              >
                {isRTL ? 'الأصناف' : 'Categories'}
                <FiChevronDown className="dropdown-icon" />
              </Link>

              {showCategoriesDropdown && categories.length > 0 && (
                <div className="dropdown-menu categories-dropdown">
                  <div className="dropdown-grid">
                    {categories.slice(0, 8).map((category) => (
                      <Link
                        key={category.category_id}
                        to={`/category/${category.category_id}`}
                        className="dropdown-item"
                        onClick={() => {
                          setShowCategoriesDropdown(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        {category.category_image && (
                          <img
                            src={category.category_image}
                            alt={category.name || category.category_name_en}
                            className="dropdown-item-image"
                          />
                        )}
                        <span>{category.name || category.category_name_en}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/categories"
                    className="dropdown-view-all"
                    onClick={() => setShowCategoriesDropdown(false)}
                  >
                    {isRTL ? 'تصفح جميع الأصناف' : 'View All Categories'}
                  </Link>
                </div>
              )}
            </li>

            {navLinks.slice(1).map((link) => (
              <li key={link.to} className="nav-item">
                <Link
                  to={link.to}
                  className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Search */}
          <form className="mobile-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={isRTL ? 'ابحثي عن المنتجات...' : 'Search for products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn" aria-label="Search">
              <FiSearch />
            </button>
          </form>

          {/* Mobile Categories List */}
          <div className="mobile-categories">
            <h4 className="mobile-categories-title">
              {isRTL ? 'تسوقي حسب الصنف' : 'Shop by Category'}
            </h4>
            <div className="mobile-categories-grid">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.category_id}
                  to={`/category/${category.category_id}`}
                  className="mobile-category-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name || category.category_name_en}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="header-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
