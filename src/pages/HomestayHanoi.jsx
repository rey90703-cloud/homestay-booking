import React from 'react';
import Hero from '../components/Hero';
import HomestaySection from '../components/HomestaySection';
import IntroSection from '../components/IntroSection';
import './HomestayHanoi.css';

function HomestayHanoi() {
  const hanoiHomestays = [
    {
      name: 'The Chill House – Tây Hồ',
      image: '/images/hn1-a061b2.png',
      badge: 'Trending',
      price: '650.000đ/đêm',
      rating: '⭐ 4.8/5',
      heartIcon: '/images/icon-heart-1.svg'
    },
    {
      name: 'Old Quarter Loft – Hoàn Kiếm',
      image: '/images/hn2-7326f7.png',
      badge: 'Mới',
      price: '820.000đ/đêm',
      rating: '⭐ 4.7/5',
      heartIcon: '/images/icon-heart-2.svg'
    },
    {
      name: 'Lake View Studio – Trúc Bạch',
      image: '/images/hn3-64c570.png',
      badge: 'Ưa thích',
      price: '720.000đ/đêm',
      rating: '⭐ 4.9/5',
      heartIcon: '/images/icon-heart-3.svg'
    },
    {
      name: 'Skyline Minimal – Cầu Giấy',
      image: '/images/hn4-a061b2.png',
      badge: 'Hot',
      price: '680.000đ/đêm',
      rating: '⭐ 4.6/5',
      heartIcon: '/images/icon-heart-4.svg'
    },
    {
      name: 'Heritage House – Phố Cổ',
      image: '/images/hn1-a061b2.png',
      badge: 'Authentic',
      price: '750.000đ/đêm',
      rating: '⭐ 4.7/5',
      heartIcon: '/images/icon-heart-1.svg'
    },
    {
      name: 'Garden Villa – Ba Đình',
      image: '/images/hn2-7326f7.png',
      badge: 'Premium',
      price: '920.000đ/đêm',
      rating: '⭐ 4.9/5',
      heartIcon: '/images/icon-heart-2.svg'
    },
    {
      name: 'Cozy Studio – Đống Đa',
      image: '/images/hn3-64c570.png',
      badge: 'Budget',
      price: '550.000đ/đêm',
      rating: '⭐ 4.6/5',
      heartIcon: '/images/icon-heart-3.svg'
    },
    {
      name: 'Modern Loft – Hai Bà Trưng',
      image: '/images/hn4-a061b2.png',
      badge: 'Chic',
      price: '780.000đ/đêm',
      rating: '⭐ 4.8/5',
      heartIcon: '/images/icon-heart-4.svg'
    }
  ];

  return (
    <div className="homestay-hanoi-page">
      <Hero />
      
      <section className="location-intro">
        <div className="location-intro-content">
          <h1 className="location-title">Khám phá Homestay tại Hà Nội</h1>
          <p className="location-description">
            Thủ đô nghìn năm văn hiến với những homestay độc đáo, từ phố cổ sầm uất đến 
            khu vực Tây Hồ yên bình. Trải nghiệm không gian sống hiện đại kết hợp nét 
            truyền thống đặc trưng của Hà Nội.
          </p>
          <div className="location-stats">
            <div className="stat-item">
              <span className="stat-number">200+</span>
              <span className="stat-label">Homestay</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">15</span>
              <span className="stat-label">Quận/Huyện</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4.8</span>
              <span className="stat-label">Đánh giá TB</span>
            </div>
          </div>
        </div>
      </section>

      <HomestaySection 
        title="Homestay nổi bật tại Hà Nội" 
        homestays={hanoiHomestays} 
      />
    </div>
  );
}

export default HomestayHanoi;
