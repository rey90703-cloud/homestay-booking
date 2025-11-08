import React from 'react';
import Hero from '../components/Hero';
import IntroSection from '../components/IntroSection';
import HomestaySection from '../components/HomestaySection';
import DestinationsSection from '../components/DestinationsSection';
import AmenitiesSection from '../components/AmenitiesSection';
import PromotionSection from '../components/PromotionSection';
import TestimonialSection from '../components/TestimonialSection';

function Home() {
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
    }
  ];

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
    }
  ];

  return (
    <>
      <Hero />
      <IntroSection />
      <HomestaySection title="Homestay nổi bật tại Hà Nội" homestays={hanoiHomestays} />
      <HomestaySection title="Homestay đẹp tại Lào Cai (Sa Pa)" homestays={laoCaiHomestays} />
      <DestinationsSection />
      <AmenitiesSection />
      <PromotionSection />
      <TestimonialSection />
    </>
  );
}

export default Home;

