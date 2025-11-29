import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import './AnimatedTestimonials.css';

/**
 * AnimatedTestimonials Component
 * 
 * Minimal testimonials with image and quote for clean, modern design.
 * Based on ScrollX-UI AnimatedTestimonials component.
 * 
 * @param {Object} props - Component props
 * @param {Array<Testimonial>} props.data - Array of testimonial objects
 * @param {boolean} [props.autoPlay=true] - Enable auto-play
 * @param {number} [props.autoPlayInterval=5000] - Auto-play interval in ms
 * @param {string} [props.className=''] - Additional CSS class
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
const AnimatedTestimonials = ({
  data = [],
  autoPlay = true,
  autoPlayInterval = 5000,
  className = ''
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Viewport-based animation pausing (Requirements: 7.4, 7.5)
  const [containerRef, isInViewport] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: false // Keep observing for pause/resume
  });
  
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayRef = useRef(null);
  const isHoveredRef = useRef(false);

  /**
   * Go to next testimonial
   */
  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % data.length);
  }, [data.length]);

  /**
   * Go to previous testimonial
   */
  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + data.length) % data.length);
  }, [data.length]);

  /**
   * Start auto-play timer
   * Pauses when not in viewport (Requirements: 7.4, 7.5)
   */
  const startAutoPlay = useCallback(() => {
    if (!autoPlay || data.length <= 1 || !isInViewport) return;
    
    autoPlayRef.current = setInterval(() => {
      if (!isHoveredRef.current) {
        goToNext();
      }
    }, autoPlayInterval);
  }, [autoPlay, autoPlayInterval, data.length, goToNext, isInViewport]);

  /**
   * Stop auto-play timer
   */
  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
  }, []);

  // Setup auto-play - pause when not in viewport (Requirements: 7.4, 7.5)
  useEffect(() => {
    if (isInViewport) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }
    return stopAutoPlay;
  }, [startAutoPlay, stopAutoPlay, isInViewport]);

  // Reset auto-play timer on navigation
  useEffect(() => {
    stopAutoPlay();
    if (isInViewport) {
      startAutoPlay();
    }
  }, [activeIndex, startAutoPlay, stopAutoPlay, isInViewport]);

  // Don't render if no data
  if (data.length === 0) {
    return null;
  }

  const currentTestimonial = data[activeIndex];

  // Animation variants - giống ScrollX-UI
  const imageVariants = {
    enter: {
      opacity: 0,
      scale: 0.9,
      rotateY: -20,
    },
    center: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      rotateY: 20,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
      },
    },
  };

  const textVariants = {
    enter: {
      opacity: 0,
      y: 20,
    },
    center: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.5,
        delay: 0.1,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
      },
    },
  };

  return (
    <div 
      ref={containerRef}
      className={`animated-testimonials ${className}`.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Customer testimonials"
      aria-roledescription="carousel"
    >
      <div className="animated-testimonials__content">
        {/* Image Section - Large image with 3D effect */}
        <div className="animated-testimonials__image-section">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="animated-testimonials__image-wrapper"
              style={{ perspective: '1000px' }}
            >
              <img
                src={currentTestimonial.image}
                alt={currentTestimonial.name}
                className="animated-testimonials__image"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
          
          {/* Thumbnail navigation */}
          <div className="animated-testimonials__thumbnails">
            {data.map((item, index) => (
              <button
                key={index}
                className={`animated-testimonials__thumbnail ${index === activeIndex ? 'animated-testimonials__thumbnail--active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`View testimonial from ${item.name}`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Text Section */}
        <div className="animated-testimonials__text-section">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="animated-testimonials__text-content"
            >
              <blockquote className="animated-testimonials__quote">
                {currentTestimonial.description}
              </blockquote>
              
              <div className="animated-testimonials__author">
                <span className="animated-testimonials__name">
                  {currentTestimonial.name}
                </span>
                {currentTestimonial.handle && (
                  <span className="animated-testimonials__handle">
                    {currentTestimonial.handle}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="animated-testimonials__navigation">
            <button
              className="animated-testimonials__nav-btn"
              onClick={goToPrev}
              aria-label="Previous testimonial"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </button>
            
            <button
              className="animated-testimonials__nav-btn"
              onClick={goToNext}
              aria-label="Next testimonial"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTestimonials;
