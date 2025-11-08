import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate form submission
    console.log('Form submitted:', formData);
    setSubmitStatus('success');
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setSubmitStatus(null);
    }, 3000);
  };

  return (
    <div className="contact-page">
      {/* Hero Section with Search Bar */}
      <section className="contact-hero">
        <div className="contact-hero-background">
          <img src="/images/hero-bg-28e1f0.png" alt="Contact background" className="contact-hero-image" />
          <div className="contact-hero-gradient"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <span>Khám phá nơi nghỉ dưỡng lý tưởng tại Việt Nam 🌿</span>
          </div>
          
          <SearchBar variant="hero" />
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">Liên hệ với chúng tôi</h1>
            <p className="contact-subtitle">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy để lại thông tin và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
            </p>
          </div>

          <div className="contact-content">
            {/* Contact Information */}
            <div className="contact-info">
              <div className="info-card">
                <div className="info-icon-wrapper">
                  <img src="/images/icon-phone.svg" alt="Phone" className="info-icon" />
                </div>
                <h3 className="info-title">Điện thoại</h3>
                <p className="info-text">+84 123 456 789</p>
                <p className="info-text">+84 987 654 321</p>
              </div>

              <div className="info-card">
                <div className="info-icon-wrapper">
                  <img src="/images/icon-email.svg" alt="Email" className="info-icon" />
                </div>
                <h3 className="info-title">Email</h3>
                <p className="info-text">contact@homestaybooking.vn</p>
                <p className="info-text">support@homestaybooking.vn</p>
              </div>

              <div className="info-card">
                <div className="info-icon-wrapper">
                  <img src="/images/icon-location.svg" alt="Location" className="info-icon" />
                </div>
                <h3 className="info-title">Địa chỉ</h3>
                <p className="info-text">123 Đường ABC, Quận 1</p>
                <p className="info-text">Thành phố Hồ Chí Minh, Việt Nam</p>
              </div>

              <div className="info-card">
                <div className="info-icon-wrapper">
                  <img src="/images/icon-clock.svg" alt="Hours" className="info-icon" />
                </div>
                <h3 className="info-title">Giờ làm việc</h3>
                <p className="info-text">Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                <p className="info-text">Thứ 7 - CN: 9:00 - 17:00</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Họ và tên *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="Nguyễn Văn A"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="0123 456 789"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Chủ đề</label>
                    <select
                      name="subject"
                      className="form-input"
                      value={formData.subject}
                      onChange={handleChange}
                    >
                      <option value="">Chọn chủ đề</option>
                      <option value="booking">Đặt phòng</option>
                      <option value="support">Hỗ trợ</option>
                      <option value="partnership">Hợp tác</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nội dung *</label>
                  <textarea
                    name="message"
                    className="form-textarea"
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="form-submit-btn">
                  <span>Gửi tin nhắn</span>
                  <img src="/images/icon-send.svg" alt="Send" className="btn-icon" />
                </button>

                {submitStatus === 'success' && (
                  <div className="submit-success">
                    ✓ Tin nhắn của bạn đã được gửi thành công! Chúng tôi sẽ phản hồi sớm nhất.
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Map Section */}
          <div className="contact-map">
            <div className="map-placeholder">
              <img src="/images/icon-map-pin.svg" alt="Map" className="map-icon" />
              <p className="map-text">Bản đồ vị trí văn phòng</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

