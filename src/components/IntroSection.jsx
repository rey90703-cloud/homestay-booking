import StatsCount from './animations/StatsCount/StatsCount';
import ScrollReveal from './animations/ScrollReveal/ScrollReveal';
import './IntroSection.css';

/**
 * Statistics data for the intro section
 * Requirements: 1.1, 1.4 - Display animated statistics with suffixes
 */
const introStats = [
  {
    value: 4.8,
    suffix: '/5',
    label: 'đánh giá',
    icon: '/images/icon-star.svg',
    decimals: 1,
    duration: 2000
  },
  {
    value: 1.2,
    suffix: 'k+',
    label: 'homestay',
    icon: '/images/icon-home.svg',
    decimals: 1,
    duration: 2000
  }
];

const IntroSection = () => {
  return (
    <section className="intro-section">
      <ScrollReveal animation="fade-up" duration={0.6}>
      <div className="intro-card">
        <div className="intro-illustration">
          <img 
            src="/images/intro-illustration.png" 
            alt="Homestay illustration" 
            className="intro-illustration__image"
          />
        </div>
        <div className="intro-content">
          <div className="intro-badge">Giới thiệu nhanh</div>
          <h3 className="intro-title">HomestayBooking là gì?</h3>
          <p className="intro-description">
            Nền tảng giúp bạn tìm & đặt homestay chất lượng tại Hà Nội và Sa Pa — nhanh chóng, minh bạch, tập trung trải nghiệm địa phương.
          </p>
          <div className="intro-stats">
            <StatsCount
              stats={introStats}
              showDividers={true}
              triggerOnce={false}
              threshold={0.3}
            />
          </div>
        </div>
      </div>
      </ScrollReveal>
      
      <ScrollReveal animation="fade-up" duration={0.6} delay={0.2} stagger={0.1}>
      <div className="features-card">
        <h4 className="features-title">Vì sao chọn HomestayBooking?</h4>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">
              <img src="/images/icon-easy.svg" alt="" aria-hidden="true" />
            </div>
            <div className="feature-content">
              <h5 className="feature-title">Dễ dùng, rõ ràng</h5>
              <p className="feature-description">Giao diện hiện đại, đi thẳng vào tìm kiếm và đặt chỗ.</p>
            </div>
            <div className="feature-image">
              <img src="/images/feature-easy.png" alt="Giao diện dễ dùng" />
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <img src="/images/icon-transparent.svg" alt="" aria-hidden="true" />
            </div>
            <div className="feature-content">
              <h5 className="feature-title">Thông tin minh bạch</h5>
              <p className="feature-description">Giá, ảnh và đánh giá được hiển thị đầy đủ, trung thực.</p>
            </div>
            <div className="feature-image">
              <img src="/images/feature-transparent.png" alt="Thông tin minh bạch" />
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <img src="/images/icon-support.svg" alt="" aria-hidden="true" />
            </div>
            <div className="feature-content">
              <h5 className="feature-title">Hỗ trợ nhanh chóng</h5>
              <p className="feature-description">Đội ngũ hỗ trợ 24/7 sẵn sàng giúp bạn trong suốt hành trình.</p>
            </div>
            <div className="feature-image">
              <img src="/images/feature-support.png" alt="Hỗ trợ 24/7" />
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <img src="/images/icon-secure.svg" alt="" aria-hidden="true" />
            </div>
            <div className="feature-content">
              <h5 className="feature-title">Thanh toán an toàn</h5>
              <p className="feature-description">Bảo mật thông tin và hỗ trợ nhiều phương thức thanh toán.</p>
            </div>
            <div className="feature-image">
              <img src="/images/feature-secure.png" alt="Thanh toán an toàn" />
            </div>
          </div>
        </div>
      </div>
      </ScrollReveal>
    </section>
  );
};

export default IntroSection;

