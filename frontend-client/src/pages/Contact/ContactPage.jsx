import { useState } from 'react';
import { FiPhone, FiMail, FiMapPin, FiSend, FiClock } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { contactApi } from '../../services/api';
import './ContactPage.css';

// Social Media Icons
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
  </svg>
);

const ContactPage = () => {
  const { t, isRTL } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const socialLinks = [
    { name: 'Instagram', url: 'https://www.instagram.com/vina_shop.ps/', icon: InstagramIcon },
    { name: 'TikTok', url: 'https://www.tiktok.com/@vina.shop25', icon: TikTokIcon },
    { name: 'Facebook', url: 'https://www.facebook.com/share/1G7TsFdjRV/', icon: FacebookIcon },
    { name: 'Snapchat', url: 'https://snapchat.com/t/oHwElDwj', icon: SnapchatIcon },
    { name: 'WhatsApp', url: 'https://wa.me/970592279873', icon: WhatsAppIcon }
  ];

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await contactApi.submit(formData);
      setStatus({ type: 'success', message: isRTL ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent successfully!' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: isRTL ? 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="container">
          <h1>{t('contact.title')}</h1>
        </div>
      </div>

      <div className="container">
        <div className="contact-layout">
          {/* Contact Form */}
          <div className="contact-form-section">
            <h2>{t('contact.getInTouch')}</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('contact.name')} *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('contact.email')} *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('contact.phone')}</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-input" dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('contact.subject')} *</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="form-input" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('contact.message')} *</label>
                <textarea name="message" value={formData.message} onChange={handleChange} className="form-textarea" rows="5" required />
              </div>
              {status.message && (
                <div className={`form-status ${status.type}`}>{status.message}</div>
              )}
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? t('contact.sending') : t('contact.send')}
                {!loading && <FiSend />}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="contact-info-section">
            <h2>{isRTL ? 'معلومات التواصل' : 'Contact Information'}</h2>
            <div className="contact-info-list">
              <div className="contact-info-item">
                <div className="info-icon"><FiPhone /></div>
                <div className="info-content">
                  <h3>{isRTL ? 'الهاتف' : 'Phone'}</h3>
                  <a href="tel:+970592279873" dir="ltr">+970 592 279 873</a>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="info-icon"><FiMail /></div>
                <div className="info-content">
                  <h3>{isRTL ? 'البريد الإلكتروني' : 'Email'}</h3>
                  <a href="mailto:info@vinashop.ps">info@vinashop.ps</a>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="info-icon"><FiMapPin /></div>
                <div className="info-content">
                  <h3>{isRTL ? 'العنوان' : 'Address'}</h3>
                  <p>{isRTL ? 'بيت لحم – شارع الدهيشة – مجمع صبيح التجاري – الطابق الثاني' : 'Bethlehem - Dheisheh St. - Sabeeh Commercial Complex - 2nd Floor'}</p>
                  <span className="sub-text">{isRTL ? 'فلسطين' : 'Palestine'}</span>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="info-icon"><FiClock /></div>
                <div className="info-content">
                  <h3>{isRTL ? 'ساعات العمل' : 'Working Hours'}</h3>
                  <p>{isRTL ? 'من 11 صباحاً - 8 مساءً' : '11 AM - 8 PM'}</p>
                  <span className="sub-text">{isRTL ? 'الجمعة: مغلق' : 'Friday: Closed'}</span>
                </div>
              </div>
            </div>

            <div className="social-section">
              <h3>{isRTL ? 'تابعينا' : 'Follow Us'}</h3>
              <div className="social-links">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    title={social.name}
                  >
                    <social.icon />
                  </a>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="whatsapp-cta">
              <a href="https://wa.me/970592279873" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
                <WhatsAppIcon />
                <span>{isRTL ? 'تواصلي معنا عبر واتساب' : 'Chat with us on WhatsApp'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
