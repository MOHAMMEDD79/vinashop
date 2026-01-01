import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const Header = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="header">
      <div className="header-left">
        <h3>{t('app.title')}</h3>
      </div>
      <div className="header-right">
        <div className="admin-info">
          <div className="admin-avatar">
            {getInitials(admin?.full_name || admin?.username)}
          </div>
          <div>
            <strong>{admin?.full_name || admin?.username}</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {admin?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          {t('app.logout')}
        </button>
      </div>
    </header>
  );
};

export default Header;
