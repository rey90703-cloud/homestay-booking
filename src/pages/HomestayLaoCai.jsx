import React from 'react';
import Hero from '../components/Hero';
import HomestaySection from '../components/HomestaySection';
import './HomestayLaoCai.css';

function HomestayLaoCai() {
  const laoCaiHomestays = [
    {
      name: 'Mountain View Retreat – Sa Pa',
      image: '/images/lc1-a061b2.png',
      badge: 'Mountain View',
      price: '550.000đ/đêm',
      rating: '⭐ 4.9/5',
      heartIcon: '/images/icon-heart-5.svg'
    },
    {
      name: 'Valley Escape – Mường Hoa',
      image: '/images/lc2-7326f7.png',
      badge: 'Eco-friendly',
      price: '620.000đ/đêm',
      rating: '⭐ 4.8/5',
      heartIcon: '/images/icon-heart-6.svg'
    },
    {
      name: 'Cloud Nine – Fansipan',
      image: '/images/lc3-64c570.png',
      badge: 'Premium',
      price: '780.000đ/đêm',
      rating: '⭐ 4.7/5',
      heartIcon: '/images/icon-heart-7.svg'
    },
    {
      name: 'Terrace Garden – Cát Cát',
      image: '/images/lc4-a061b2.png',
      badge: 'Authentic',
      price: '590.000đ/đêm',
      rating: '⭐ 4.8/5',
      heartIcon: '/images/icon-heart-8.svg'
    },
    {
      name: 'Highland Heaven – Y Tý',
      image: '/images/lc1-a061b2.png',
      badge: 'Remote',
      price: '480.000đ/đêm',
      rating: '⭐ 4.9/5',
      heartIcon: '/images/icon-heart-5.svg'
    },
    {
      name: 'Rice Terrace View – Tả Van',
      image: '/images/lc2-7326f7.png',
      badge: 'Scenic',
      price: '520.000đ/đêm',
      rating: '⭐ 4.7/5',
      heartIcon: '/images/icon-heart-6.svg'
    },
    {
      name: 'Ethnic Village Stay – Lao Chải',
      image: '/images/lc3-64c570.png',
      badge: 'Cultural',
      price: '450.000đ/đêm',
      rating: '⭐ 4.8/5',
      heartIcon: '/images/icon-heart-7.svg'
    },
    {
      name: 'Summit Lodge – Hoàng Liên Sơn',
      image: '/images/lc4-a061b2.png',
      badge: 'Adventure',
      price: '680.000đ/đêm',
      rating: '⭐ 4.9/5',
      heartIcon: '/images/icon-heart-8.svg'
    }
  ];

  return (
    <div className="homestay-laocai-page">
      <Hero />
      
      <section className="location-intro">
        <div className="location-intro-content">
          <h1 className="location-title">Khám phá Homestay tại Lào Cai</h1>
          <p className="location-description">
            Vùng đất núi non hùng vĩ với ruộng bậc thang tuyệt đẹp và văn hóa dân tộc đa dạng. 
            Trải nghiệm không gian nghỉ dưỡng giữa thiên nhiên, tận hưởng không khí trong lành 
            và khung cảnh núi rừng Tây Bắc.
          </p>
          <div className="location-stats">
            <div className="stat-item">
              <span className="stat-number">150+</span>
              <span className="stat-label">Homestay</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">8</span>
              <span className="stat-label">Khu vực</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4.9</span>
              <span className="stat-label">Đánh giá TB</span>
            </div>
          </div>
        </div>
      </section>

      <HomestaySection 
        title="Homestay đẹp tại Lào Cai (Sa Pa)" 
        homestays={laoCaiHomestays} 
      />

      <section className="seasonal-guide">
        <h2 className="seasonal-title">Mùa nào đẹp nhất?</h2>
        <div className="seasons-grid">
          <div className="season-card">
            <div className="season-period">Tháng 9-11</div>
            <h3>Mùa lúa chín</h3>
            <p>Ruộng bậc thang vàng óng, thời điểm đẹp nhất để chụp ảnh và ngắm cảnh</p>
          </div>
          <div className="season-card">
            <div className="season-period">Tháng 12-2</div>
            <h3>Mùa tuyết rơi</h3>
            <p>Có thể gặp tuyết trắng phủ đỉnh Fansipan, không khí se lạnh đặc trưng</p>
          </div>
          <div className="season-card">
            <div className="season-period">Tháng 3-5</div>
            <h3>Mùa hoa</h3>
            <p>Hoa đào, mận nở rộ khắp nơi, thung lũng xanh tươi và đầy sức sống</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomestayLaoCai;
