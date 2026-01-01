import { NavLink } from 'react-router-dom';
import {
  FiHome, FiBox, FiGrid, FiShoppingCart,
  FiDollarSign, FiImage, FiSettings, FiUserCheck,
  FiStar, FiMessageSquare, FiSliders, FiMonitor,
  FiFileText, FiAlertCircle, FiTruck, FiBriefcase
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Sidebar = () => {
  const { isSuperAdmin } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { path: '/', icon: FiHome, labelKey: 'sidebar.dashboard' },
    { section: 'content', sectionKey: 'Content' },
    { path: '/banners', icon: FiMonitor, labelKey: 'sidebar.banners' },
    { section: 'catalog', sectionKey: 'Catalog' },
    { path: '/products', icon: FiBox, labelKey: 'sidebar.products' },
    { path: '/categories', icon: FiGrid, labelKey: 'sidebar.categories' },
    { path: '/product-options', icon: FiSliders, labelKey: 'sidebar.productOptions' },
    { section: 'sales', sectionKey: 'Sales' },
    { path: '/orders', icon: FiShoppingCart, labelKey: 'sidebar.orders' },
    { path: '/reviews', icon: FiStar, labelKey: 'sidebar.reviews' },
    { path: '/messages', icon: FiMessageSquare, labelKey: 'sidebar.messages' },
    { section: 'finance', sectionKey: 'Finance' },
    { path: '/customer-bills', icon: FiFileText, labelKey: 'sidebar.customerBills' },
    { path: '/customer-debts', icon: FiAlertCircle, labelKey: 'sidebar.customerDebts' },
    { path: '/billing', icon: FiDollarSign, labelKey: 'sidebar.billing' },
    { path: '/wholesalers', icon: FiTruck, labelKey: 'sidebar.wholesalers' },
  ];

  const adminItems = [
    { section: 'admin', sectionKey: 'Super Admin' },
    { path: '/workers', icon: FiBriefcase, labelKey: 'sidebar.workers' },
    { path: '/traders', icon: FiTruck, labelKey: 'sidebar.traders' },
    { path: '/bill-images', icon: FiImage, labelKey: 'sidebar.billImages' },
    { path: '/admin-users', icon: FiUserCheck, labelKey: 'sidebar.adminUsers' },
    { path: '/settings', icon: FiSettings, labelKey: 'sidebar.settings' },
  ];

  const allItems = isSuperAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>{t('app.title')}</h2>
      </div>
      <nav className="sidebar-nav">
        {allItems.map((item, index) => (
          item.section ? (
            <div key={index} className="nav-section">{item.sectionKey}</div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          )
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
