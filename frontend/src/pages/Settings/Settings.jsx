import { FiGlobe, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const Settings = () => {
  const { language, setLanguage, t, languages } = useLanguage();

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    toast.success(t('settings.languageChanged'));
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('settings.title')}</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h2><FiGlobe style={{ marginRight: '8px' }} /> {t('settings.language')}</h2>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '20px', color: '#64748b' }}>
            {t('settings.selectLanguage')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {languages.map((lang) => (
              <div
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  padding: '20px',
                  border: language === lang.code ? '2px solid var(--primary)' : '2px solid var(--border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: language === lang.code ? 'rgba(139, 92, 246, 0.05)' : 'white',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '4px' }}>
                    {lang.nativeName}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    {lang.name}
                  </div>
                </div>
                {language === lang.code && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <FiCheck size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
