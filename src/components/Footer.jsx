import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-column footer-brand">
            <div className="footer-logo">
              <img src="/logo.png" alt="HomestayBooking Logo" className="footer-logo-img" />
              <span>HomestayBooking</span>
            </div>
            <p className="footer-description">
              Nền tảng đặt homestay uy tín tại Việt Nam. Trải nghiệm địa phương chân thực, giá cả minh bạch.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>support@homestaybooking.vn</span>
              </div>
              <div className="contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>1900 xxxx</span>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="footer-column">
            <h5 className="footer-heading">Khám phá</h5>
            <ul className="footer-links">
              <li><Link to="/" onClick={scrollToTop}>Trang chủ</Link></li>
              <li><Link to="/homestay-ha-noi" onClick={scrollToTop}>Homestay Hà Nội</Link></li>
              <li><Link to="/homestay-lao-cai" onClick={scrollToTop}>Homestay Lào Cai</Link></li>
              <li><Link to="/search" onClick={scrollToTop}>Tìm kiếm</Link></li>
            </ul>
          </div>
          
          {/* About */}
          <div className="footer-column">
            <h5 className="footer-heading">Về chúng tôi</h5>
            <ul className="footer-links">
              <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>Giới thiệu</a></li>
              <li><a href="#terms" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>Điều khoản sử dụng</a></li>
              <li><a href="#privacy" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>Chính sách bảo mật</a></li>
              <li><a href="#careers" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>Tuyển dụng</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="footer-column">
            <h5 className="footer-heading">Hỗ trợ</h5>
            <ul className="footer-links">
              <li><Link to="/contact" onClick={scrollToTop}>Liên hệ</Link></li>
              <li><a href="#help" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>Trung tâm trợ giúp</a></li>
              <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>Câu hỏi thường gặp</a></li>
              <li><a href="#host" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>Đăng ký cho thuê</a></li>
            </ul>
          </div>
          
          {/* Social */}
          <div className="footer-column">
            <h5 className="footer-heading">Kết nối với chúng tôi</h5>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="18" cy="6" r="1" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.95718 14.8821 3.28445C14.0247 3.61173 13.2884 4.1944 12.773 4.95372C12.2575 5.71303 11.9877 6.61234 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39545C5.36074 6.60508 4.01032 5.43864 3 4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.0989 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link" title="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.54 6.42C22.4212 5.94541 22.1793 5.51057 21.8387 5.15941C21.498 4.80824 21.0708 4.55318 20.6 4.42C18.88 4 12 4 12 4C12 4 5.12 4 3.4 4.46C2.92925 4.59318 2.50198 4.84824 2.16135 5.19941C1.82071 5.55057 1.57879 5.98541 1.46 6.46C1.14521 8.20556 0.991228 9.97631 1 11.75C0.988771 13.537 1.14277 15.3213 1.46 17.08C1.59096 17.5398 1.83831 17.9581 2.17818 18.2945C2.51805 18.6308 2.93884 18.8738 3.4 19C5.12 19.46 12 19.46 12 19.46C12 19.46 18.88 19.46 20.6 19C21.0708 18.8668 21.498 18.6118 21.8387 18.2606C22.1793 17.9094 22.4212 17.4746 22.54 17C22.8524 15.2676 23.0063 13.5103 23 11.75C23.0112 9.96295 22.8572 8.1787 22.54 6.42V6.42Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.75 15.02L15.5 11.75L9.75 8.48001V15.02Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-copyright">© 2025 HomestayBooking. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

