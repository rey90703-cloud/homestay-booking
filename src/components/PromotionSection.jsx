import { useState } from 'react';
import RotatingText from './animations/RotatingText/RotatingText';
import ScrollReveal from './animations/ScrollReveal/ScrollReveal';
import PromotionModal from './PromotionModal';
import './PromotionSection.css';

function PromotionSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get current month
  const getCurrentMonth = () => {
    return new Date().getMonth() + 1; // 1-12
  };

  const promotionTexts = [
    'Top homestay giảm đến 30%',
    'Ưu đãi đặc biệt cuối tuần',
    'Flash sale chỉ hôm nay',
    'Combo tiết kiệm 25%'
  ];

  return (
    <section className="promotion-section">
      <ScrollReveal animation="bounce" duration={0.7}>
      <div className="promotion-card">
        <div className="promotion-badge">
          <span>Khuyến mãi tháng {getCurrentMonth()}</span>
        </div>
        <div className="promotion-content">
          <h3 className="promotion-title">
            <RotatingText
              texts={promotionTexts}
              mainClassName="promotion-rotating-text"
              splitLevelClassName="promotion-text-word"
              staggerFrom="last"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-120%' }}
              staggerDuration={0.025}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={3000}
            />
          </h3>
          <p className="promotion-description">Đặt sớm hôm nay để nhận ưu đãi giới hạn.</p>
        </div>
        <div className="promotion-action">
          <button className="btn-promotion btn-pulse" onClick={() => setIsModalOpen(true)}>
            % Xem ưu đãi
          </button>
        </div>
      </div>
      </ScrollReveal>

      <PromotionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}

export default PromotionSection;
