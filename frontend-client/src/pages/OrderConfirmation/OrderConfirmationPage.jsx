import { Link } from 'react-router-dom';
import { FiCheckCircle, FiArrowRight, FiArrowLeft, FiPackage } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import './OrderConfirmationPage.css';

const OrderConfirmationPage = () => {
  const { t, isRTL } = useLanguage();
  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-content">
          <div className="success-icon">
            <FiCheckCircle />
          </div>
          <h1>{t('orderConfirmation.title')}</h1>
          <p className="thank-you">{t('orderConfirmation.thankYou')}</p>
          <p className="message">{t('orderConfirmation.message')}</p>
          <div className="confirmation-actions">
            <Link to="/my-orders" className="btn btn-outline btn-lg">
              <FiPackage />
              {isRTL ? 'طلباتي' : 'My Orders'}
            </Link>
            <Link to="/products" className="btn btn-primary btn-lg">
              {t('orderConfirmation.continueShopping')}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
