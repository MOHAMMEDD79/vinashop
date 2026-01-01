import { useLanguage } from '../../context/LanguageContext';
import './Loading.css';

const Loading = ({ text, size = 'md' }) => {
  const { t } = useLanguage();

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${size}`} />
      {text !== false && (
        <p className="loading-text">{text || t('common.loading')}</p>
      )}
    </div>
  );
};

export default Loading;
