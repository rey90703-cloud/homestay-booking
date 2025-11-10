import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import HomestaySection from '../components/HomestaySection';
import IntroSection from '../components/IntroSection';
import API_BASE_URL from '../config/api';
import './HomestayHanoi.css';

function HomestayHanoi() {
  const [hanoiHomestays, setHanoiHomestays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    districts: 15,
    avgRating: 4.8
  });

  useEffect(() => {
    fetchHomestays();
  }, []);

  const fetchHomestays = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/homestays?city=Hà Nội&status=active`);
      const data = await response.json();
      
      if (data.success) {
        setHanoiHomestays(formatHomestays(data.data));
        setStats({
          total: data.data.length,
          districts: 15,
          avgRating: calculateAverageRating(data.data)
        });
      }
    } catch (error) {
      console.error('Error fetching homestays:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHomestays = (homestays) => {
    return homestays.map((homestay, index) => ({
      id: homestay._id,
      name: homestay.title,
      image: homestay.coverImage || '/images/hn1-a061b2.png',
      badge: homestay.verificationStatus === 'approved' ? 'Verified' : 'New',
      price: `${new Intl.NumberFormat('vi-VN').format(homestay.pricing?.basePrice || 0)}đ/đêm`,
      rating: `⭐ ${homestay.averageRating || 5.0}/5`,
      heartIcon: `/images/icon-heart-${(index % 8) + 1}.svg`
    }));
  };

  const calculateAverageRating = (homestays) => {
    if (homestays.length === 0) return 4.8;
    const total = homestays.reduce((sum, h) => sum + (h.averageRating || 5.0), 0);
    return (total / homestays.length).toFixed(1);
  };

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
              <span className="stat-number">{stats.total}+</span>
              <span className="stat-label">Homestay</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.districts}</span>
              <span className="stat-label">Quận/Huyện</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.avgRating}</span>
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
