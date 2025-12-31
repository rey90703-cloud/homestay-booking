import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import IntroSection from '../components/IntroSection';
import HomestaySection from '../components/HomestaySection';
import DestinationsSection from '../components/DestinationsSection';
import AmenitiesSection from '../components/AmenitiesSection';
import PromotionSection from '../components/PromotionSection';
import TestimonialSection from '../components/TestimonialSection';
import PartnersSection from '../components/PartnersSection';
import API_BASE_URL from '../config/api';

function Home() {
  const [hanoiHomestays, setHanoiHomestays] = useState([]);
  const [laoCaiHomestays, setLaoCaiHomestays] = useState([]);

  useEffect(() => {
    fetchHomestays();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHomestays = async () => {
    try {
      const hanoiResponse = await fetch(`${API_BASE_URL}/homestays?city=Hà Nội&limit=6&status=active`);
      const hanoiData = await hanoiResponse.json();
      
      const laoCaiResponse = await fetch(`${API_BASE_URL}/homestays?city=Lào Cai&limit=6&status=active`);
      const laoCaiData = await laoCaiResponse.json();
      
      if (hanoiData.success) {
        setHanoiHomestays(formatHomestays(hanoiData.data));
      }
      
      if (laoCaiData.success) {
        setLaoCaiHomestays(formatHomestays(laoCaiData.data));
      }
    } catch (error) {
      console.error('Error fetching homestays:', error);
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

  return (
    <>
      <Hero />
      <IntroSection />
      <HomestaySection 
        title="Homestay nổi bật tại Hà Nội" 
        homestays={hanoiHomestays} 
        useExpandableView={true}
      />
      <HomestaySection 
        title="Homestay đẹp tại Lào Cai (Sa Pa)" 
        homestays={laoCaiHomestays} 
        useExpandableView={true}
      />
      <DestinationsSection />
      <AmenitiesSection />
      <PromotionSection />
      <TestimonialSection />
      <PartnersSection />
    </>
  );
}

export default Home;

