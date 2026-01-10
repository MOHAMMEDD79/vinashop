import { useLanguage } from '../../context/LanguageContext';
import { FiMapPin, FiMail, FiPhone, FiClock, FiInstagram, FiFacebook, FiStar, FiUsers, FiTruck, FiAward } from 'react-icons/fi';
import aboutStoreImage from '../../assets/sit-images/IMG_6875.jpg';
import './AboutPage.css';

const AboutPage = () => {
  const { isRTL } = useLanguage();

  const values = [
    {
      icon: <FiStar />,
      titleEn: 'Quality',
      titleAr: 'الجودة',
      descEn: 'High quality guaranteed products from trusted brands',
      descAr: 'منتجات عالية الجودة ومضمونة من علامات تجارية موثوقة'
    },
    {
      icon: <FiUsers />,
      titleEn: 'Trust',
      titleAr: 'الثقة',
      descEn: 'Building long-term relationships with our customers',
      descAr: 'بناء علاقات طويلة الأمد مع عملائنا'
    },
    {
      icon: <FiTruck />,
      titleEn: 'Fast Delivery',
      titleAr: 'توصيل سريع',
      descEn: 'Fast and reliable delivery to all areas',
      descAr: 'توصيل سريع وموثوق لجميع المناطق'
    },
    {
      icon: <FiAward />,
      titleEn: 'Satisfaction',
      titleAr: 'الرضا',
      descEn: 'Customer satisfaction is our top priority',
      descAr: 'رضا العميل هو أولويتنا القصوى'
    }
  ];

  const socialLinks = [
    {
      name: 'Instagram',
      icon: <FiInstagram />,
      url: 'https://www.instagram.com/vina_shop.ps/',
      handle: '@vina_shop.ps'
    },
    {
      name: 'Facebook',
      icon: <FiFacebook />,
      url: 'https://www.facebook.com/share/1G7TsFdjRV/',
      handle: 'VinaShop'
    },
    {
      name: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      ),
      url: 'https://www.tiktok.com/@vina.shop25',
      handle: '@vina.shop25'
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      url: 'https://wa.me/message/IBUEW6EDDLWWK1',
      handle: isRTL ? 'تواصلي معنا' : 'Chat with us'
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <h1>{isRTL ? 'من نحن' : 'About Us'}</h1>
          <p className="hero-subtitle">
            {isRTL
              ? 'وجهتك الأولى للحقائب والإكسسوارات في فلسطين'
              : 'Your premier destination for bags and accessories in Palestine'
            }
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story section">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <h2 className="section-title">
                {isRTL ? 'قصتنا' : 'Our Story'}
              </h2>
              <p>
                {isRTL
                  ? 'بدأنا من حبّنا للتفاصيل في بداية عام 2025، ومن رغبتنا بتقديم اختيارات نثق بها قبل أن نضعها بين يديكِ.'
                  : 'We started from our love of details at the beginning of 2025, and from our desire to offer choices we trust before placing them in your hands.'
                }
              </p>
              <p>
                {isRTL
                  ? 'كل قطعة في متجرنا مختارة بعناية، بجودة نلتزم بها وذوق يليق بكِ.'
                  : 'Every piece in our store is carefully selected, with quality we commit to and taste that suits you.'
                }
              </p>
              <p>
                {isRTL
                  ? 'هدفنا أن تصلك كل قطعة وأنتِ واثقة أنكِ اخترتِ متجرًا يقدّر ذوقك ويهتم بأدق التفاصيل.'
                  : 'Our goal is for every piece to reach you while you are confident that you chose a store that appreciates your taste and cares about the finest details.'
                }
              </p>
            </div>
            <div className="story-image">
              <img
                src={aboutStoreImage}
                alt="VinaShop Store"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{isRTL ? 'قيمنا' : 'Our Values'}</h2>
            <p className="section-subtitle">
              {isRTL
                ? 'ما يميزنا ويجعلنا خيارك الأول'
                : 'What sets us apart and makes us your first choice'
              }
            </p>
          </div>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <span className="value-icon">{value.icon}</span>
                <h3>{isRTL ? value.titleAr : value.titleEn}</h3>
                <p>{isRTL ? value.descAr : value.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Policy Section */}
      <section className="about-policy section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{isRTL ? 'سياسة الإرجاع والتبديل' : 'Return & Exchange Policy'}</h2>
          </div>
          <div className="policy-content">
            <p className="policy-statement">
              {isRTL
                ? 'في Vina Shop، الثقة والوضوح أساس تعاملنا، وإن لم تكن القطعة مطابقة لما اتفقنا عليه، يسعدنا إرجاعها بكل راحة'
                : 'At Vina Shop, trust and transparency are the foundation of our dealings. If the item does not match what we agreed upon, we are happy to accept returns with ease'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="about-location section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{isRTL ? 'موقعنا' : 'Our Location'}</h2>
            <p className="section-subtitle">
              {isRTL
                ? 'زوري متجرنا أو تواصلي معنا'
                : 'Visit our store or get in touch'
              }
            </p>
          </div>

          <div className="location-content">
            {/* Map */}
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps?q=31.695008,35.180599&hl=ar&z=15&output=embed"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="VinaShop Location"
              />
            </div>

            {/* Contact Info */}
            <div className="contact-info">
              <div className="contact-card">
                <div className="contact-item">
                  <div className="contact-icon">
                    <FiMapPin />
                  </div>
                  <div className="contact-details">
                    <h4>{isRTL ? 'العنوان' : 'Address'}</h4>
                    <p>
                      {isRTL
                        ? 'بيت لحم – شارع الدهيشة – مجمع صبيح التجاري – الطابق الثاني'
                        : 'Bethlehem - Dheisheh St. - Sabeeh Commercial Complex - 2nd Floor'
                      }
                    </p>
                    <span className="contact-sub">
                      {isRTL ? 'بيت لحم، فلسطين' : 'Bethlehem, Palestine'}
                    </span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FiMail />
                  </div>
                  <div className="contact-details">
                    <h4>{isRTL ? 'البريد الإلكتروني' : 'Email'}</h4>
                    <a href="mailto:info@vinashop.ps">info@vinashop.ps</a>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FiPhone />
                  </div>
                  <div className="contact-details">
                    <h4>{isRTL ? 'واتساب' : 'WhatsApp'}</h4>
                    <a
                      href="https://wa.me/message/IBUEW6EDDLWWK1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {isRTL ? 'تواصلي معنا عبر واتساب' : 'Chat with us on WhatsApp'}
                    </a>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FiClock />
                  </div>
                  <div className="contact-details">
                    <h4>{isRTL ? 'ساعات العمل' : 'Working Hours'}</h4>
                    <p>{isRTL ? 'من 11 صباحاً - 8 مساءً' : '11 AM - 8 PM'}</p>
                    <span className="contact-sub">{isRTL ? 'الجمعة: مغلق' : 'Friday: Closed'}</span>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="social-section">
                <h4>{isRTL ? 'تابعينا' : 'Follow Us'}</h4>
                <div className="social-links">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title={social.name}
                    >
                      {social.icon}
                      <span>{social.handle}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <div className="cta-content">
            <h2>{isRTL ? 'ابدأي التسوق الآن' : 'Start Shopping Now'}</h2>
            <p>
              {isRTL
                ? 'اكتشفي مجموعتنا الواسعة من الشنط والإكسسوارات'
                : 'Discover our wide collection of fashion and accessories'
              }
            </p>
            <a href="/products" className="btn btn-primary btn-lg">
              {isRTL ? 'تصفحي المنتجات' : 'Browse Products'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
