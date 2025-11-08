import React from 'react';
import './IntroSection.css';

const IntroSection = () => {
  return (
    <section className="intro-section">
      <div className="intro-card">
        <div className="intro-badge">Giới thiệu nhanh</div>
        <h3 className="intro-title">HomestayBooking là gì?</h3>
        <p className="intro-description">
          Nền tảng giúp bạn tìm & đặt homestay chất lượng tại Hà Nội và Sa Pa — nhanh chóng, minh bạch, tập trung trải nghiệm địa phương.
        </p>
        <div className="intro-stats">
          <div className="stat-card">
            <img src="/images/icon-star.svg" alt="star" className="stat-icon" />
            <div className="stat-value">4.8/5</div>
            <div className="stat-label">đánh giá</div>
          </div>
          <div className="stat-card">
            <img src="/images/icon-home.svg" alt="home" className="stat-icon" />
            <div className="stat-value">1.2k+</div>
            <div className="stat-label">homestay</div>
          </div>
        </div>
      </div>
      
      <div className="features-card">
        <h4 className="features-title">Vì sao chọn HomestayBooking?</h4>
        <div className="features-grid">
          <div className="feature-item">
            <h5 className="feature-title">Dễ dùng, rõ ràng</h5>
            <p className="feature-description">Giao diện hiện đại, đi thẳng vào tìm kiếm và đặt chỗ.</p>
          </div>
          <div className="feature-item">
            <h5 className="feature-title">Thông tin minh bạch</h5>
            <p className="feature-description">Giá, ảnh và đánh giá được hiển thị đầy đủ, trung thực.</p>
          </div>
          <div className="feature-item">
            <h5 className="feature-title">Hỗ trợ nhanh chóng</h5>
            <p className="feature-description">Đội ngũ hỗ trợ 24/7 sẵn sàng giúp bạn trong suốt hành trình.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;

