import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import HomestaySection from '../components/HomestaySection';
import API_BASE_URL from '../config/api';
import './HomestayLaoCai.css';

function HomestayLaoCai() {
  const [laoCaiHomestays, setLaoCaiHomestays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    areas: 8,
    avgRating: 4.9
  });

  useEffect(() => {
    fetchHomestays();
  }, []);

  const fetchHomestays = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/homestays?city=Lào Cai&status=active`);
      const data = await response.json();
      
      if (data.success) {
        setLaoCaiHomestays(formatHomestays(data.data));
        setStats({
          total: data.data.length,
          areas: 8,
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
      image: homestay.coverImage || '/images/lc1-a061b2.png',
      badge: homestay.verificationStatus === 'approved' ? 'Verified' : 'New',
      price: `${new Intl.NumberFormat('vi-VN').format(homestay.pricing?.basePrice || 0)}đ/đêm`,
      rating: `⭐ ${homestay.averageRating || 5.0}/5`,
      heartIcon: `/images/icon-heart-${(index % 8) + 1}.svg`
    }));
  };

  const calculateAverageRating = (homestays) => {
    if (homestays.length === 0) return 4.9;
    const total = homestays.reduce((sum, h) => sum + (h.averageRating || 5.0), 0);
    return (total / homestays.length).toFixed(1);
  };

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
              <span className="stat-number">{stats.total}+</span>
              <span className="stat-label">Homestay</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.areas}</span>
              <span className="stat-label">Khu vực</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.avgRating}</span>
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
