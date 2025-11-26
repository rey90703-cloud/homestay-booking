import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-column">
            <h4 className="footer-title">HomestayBooking</h4>
            <p className="footer-description">
              Nền tảng đặt homestay uy tín tại Việt Nam. Trải nghiệm địa phương chân thực, giá cả minh bạch.
            </p>
          </div>
          
          <div className="footer-column">
            <h5 className="footer-heading">Về chúng tôi</h5>
            <ul className="footer-links">
              <li><a href="#">Giới thiệu</a></li>
              <li><a href="#">Điều khoản</a></li>
              <li><a href="#">Chính sách</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h5 className="footer-heading">Hỗ trợ</h5>
            <ul className="footer-links">
              <li><a href="#">Trung tâm trợ giúp</a></li>
              <li><a href="#">Liên hệ</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h5 className="footer-heading">Kết nối</h5>
            <div className="footer-social">
              <a href="#" className="social-link">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M16.5 1.83334H13.75C12.5344 1.83334 11.3688 2.31585 10.5124 3.17227C9.65595 4.02869 9.17344 5.19421 9.17344 6.41001V9.16668H6.41677V12.8333H9.17344V20.1667H12.8401V12.8333H15.5968L16.5 9.16668H12.8401V6.41001C12.8401 6.16975 12.9356 5.93942 13.1059 5.76907C13.2763 5.59872 13.5066 5.50334 13.7468 5.50334H16.5V1.83334Z" stroke="#F9FAFB" strokeWidth="1.83333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#" className="social-link">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M15.5833 1.83334H6.41667C3.86548 1.83334 1.83333 3.86548 1.83333 6.41668V15.5833C1.83333 18.1345 3.86548 20.1667 6.41667 20.1667H15.5833C18.1345 20.1667 20.1667 18.1345 20.1667 15.5833V6.41668C20.1667 3.86548 18.1345 1.83334 15.5833 1.83334Z" stroke="#F9FAFB" strokeWidth="1.83333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.6667 10.4083C14.7489 10.9717 14.6542 11.5467 14.3952 12.0567C14.1362 12.5667 13.7252 12.9878 13.2206 13.2593C12.716 13.5308 12.1423 13.6397 11.5773 13.5717C11.0123 13.5037 10.4813 13.2619 10.0548 12.8785C9.62832 12.495 9.32632 11.9878 9.18932 11.4283C9.05232 10.8688 9.08632 10.2833 9.28632 9.74501C9.48632 9.20668 9.84432 8.74168 10.3143 8.41168C10.7843 8.08168 11.3443 7.90168 11.9167 7.90168C12.6667 7.90168 13.3833 8.20168 13.9167 8.73501C14.45 9.26834 14.75 9.98501 14.75 10.735" stroke="#F9FAFB" strokeWidth="1.83333" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="16.5" cy="5.5" r="0.916667" fill="#F9FAFB"/>
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

