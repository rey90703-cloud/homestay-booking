import React from 'react';
import SearchBar from './SearchBar';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-background">
        <img src="/images/hero-bg-28e1f0.png" alt="Hero background" className="hero-image" />
        <div className="hero-gradient"></div>
      </div>
      
      <div className="hero-content">
        <div className="hero-badge">
          <span>Khám phá nơi nghỉ dưỡng lý tưởng tại Việt Nam 🌿</span>
        </div>
        
        <SearchBar variant="hero" />
      </div>
    </section>
  );
};

export default Hero;

