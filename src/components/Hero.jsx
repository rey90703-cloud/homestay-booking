import React from 'react';
import SearchBar from './SearchBar';
import { TypeAnimation } from './animations';
import './Hero.css';

/**
 * Hero Section Component
 * 
 * Displays the main hero section with animated typing effect for destinations.
 * Requirements: 2.1 - Display typing animation for hero badge text
 */
const Hero = () => {
  // Vietnamese destination names for typing animation
  const destinations = [
    'Hà Nội',
    'Sapa',
    'Đà Nẵng',
    'Hội An',
    'Nha Trang',
    'Đà Lạt',
    'Phú Quốc'
  ];

  return (
    <section className="hero">
      <div className="hero-background">
        <img src="/images/hero-bg-28e1f0.png" alt="Hero background" className="hero-image" />
        <div className="hero-gradient"></div>
      </div>
      
      <div className="hero-content">
        <div className="hero-badge">
          <span>
            Khám phá nơi nghỉ dưỡng lý tưởng tại{' '}
            <TypeAnimation
              texts={destinations}
              typingSpeed={75}
              deletingSpeed={50}
              pauseDuration={2000}
              loop={true}
              showCursor={true}
              cursorCharacter="|"
              className="hero-destination-text"
            />
            {' '}🌿
          </span>
        </div>
        
        <SearchBar variant="hero" />
      </div>
    </section>
  );
};

export default Hero;

