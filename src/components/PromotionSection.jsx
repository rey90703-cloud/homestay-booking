import React from 'react';
import './PromotionSection.css';

function PromotionSection() {
  return (
    <section className="promotion-section">
      <div className="promotion-card">
        <div className="promotion-badge">
          <span>Khuyến mãi tháng 11</span>
        </div>
        <div className="promotion-content">
          <h3 className="promotion-title">Top homestay giảm đến 30%</h3>
          <p className="promotion-description">Đặt sớm hôm nay để nhận ưu đãi giới hạn.</p>
        </div>
        <div className="promotion-action">
          <button className="btn-promotion">
            % Xem ưu đãi
          </button>
        </div>
      </div>
    </section>
  );
}

export default PromotionSection;

