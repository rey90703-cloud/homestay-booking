import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './StatsCount.css';

/**
 * StatsCount - Animated statistics counter component
 * 
 * Displays statistics with animated counting effect triggered on scroll.
 * Supports prefixes, suffixes, and decimal values.
 * 
 * @param {Object} props
 * @param {Array<StatItem>} props.stats - Array of stat items to display
 * @param {string} [props.title] - Optional title text
 * @param {boolean} [props.showDividers=true] - Show dividers between stats
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.triggerOnce=true] - Only trigger animation once
 * @param {number} [props.threshold=0.3] - Intersection threshold
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
const StatsCount = ({
  stats = [],
  title,
  showDividers = true,
  className = '',
  triggerOnce = true,
  threshold = 0.3
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [ref, isVisible] = useIntersectionObserver({
    threshold,
    triggerOnce
  });


  // State to track current counter values
  const [counters, setCounters] = useState(() =>
    stats.map(() => 0)
  );
  
  // Track if animation has started
  const [hasStarted, setHasStarted] = useState(false);
  
  // Refs for animation frames
  const animationFrameRefs = useRef([]);
  const startTimeRefs = useRef([]);

  /**
   * Easing function for smooth animation
   * Uses easeOutQuart for natural deceleration
   */
  const easeOutQuart = useCallback((t) => {
    return 1 - Math.pow(1 - t, 4);
  }, []);

  /**
   * Format number with decimals
   */
  const formatNumber = useCallback((value, decimals = 0) => {
    return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  }, []);

  /**
   * Animate a single counter using requestAnimationFrame
   * Requirements: 1.2 - Animate from 0 to target within duration
   */
  const animateCounter = useCallback((index, targetValue, duration, decimals) => {
    const startTime = performance.now();
    startTimeRefs.current[index] = startTime;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = targetValue * easedProgress;

      setCounters(prev => {
        const newCounters = [...prev];
        newCounters[index] = currentValue;
        return newCounters;
      });

      if (progress < 1) {
        animationFrameRefs.current[index] = requestAnimationFrame(animate);
      }
    };

    animationFrameRefs.current[index] = requestAnimationFrame(animate);
  }, [easeOutQuart]);


  /**
   * Start all counter animations when visible
   * Requirements: 1.1 - Trigger animation when scrolled into view
   * Requirements: 1.3 - Keep values at 0 until scroll triggers
   */
  useEffect(() => {
    if (isVisible && !hasStarted && stats.length > 0) {
      setHasStarted(true);

      // If reduced motion is preferred, show final values immediately
      // Requirements: 6.4, 6.5 - Respect reduced motion preferences
      if (prefersReducedMotion) {
        setCounters(stats.map(stat => stat.value));
        return;
      }

      // Start animation for each stat
      stats.forEach((stat, index) => {
        const duration = stat.duration || 2000; // Default 2 seconds
        const decimals = stat.decimals || 0;
        animateCounter(index, stat.value, duration, decimals);
      });
    }
    
    // Reset when leaving viewport (if triggerOnce is false)
    if (!isVisible && !triggerOnce) {
      // Cancel any ongoing animations
      animationFrameRefs.current.forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });
      // Reset counters to 0
      setCounters(stats.map(() => 0));
      setHasStarted(false);
    }
  }, [isVisible, hasStarted, stats, prefersReducedMotion, animateCounter, triggerOnce]);

  /**
   * Cleanup animation frames on unmount
   * Requirements: 1.5 - Continue animation to completion (cleanup only on unmount)
   */
  useEffect(() => {
    return () => {
      animationFrameRefs.current.forEach(frameId => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
      });
    };
  }, []);

  /**
   * Format the display value with prefix and suffix
   * Requirements: 1.4 - Display final values with suffixes
   */
  const getDisplayValue = (stat, currentValue) => {
    const decimals = stat.decimals || 0;
    const formattedValue = formatNumber(currentValue, decimals);
    const prefix = stat.prefix || '';
    const suffix = stat.suffix || '';
    return `${prefix}${formattedValue}${suffix}`;
  };

  if (stats.length === 0) {
    return null;
  }


  return (
    <div 
      ref={ref} 
      className={`stats-count ${className}`.trim()}
      role="region"
      aria-label="Statistics"
    >
      {title && (
        <h3 className="stats-count__title">{title}</h3>
      )}
      
      <div className="stats-count__container">
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label || index}>
            <div className="stats-count__item">
              {stat.icon && (
                <img 
                  src={stat.icon} 
                  alt="" 
                  className="stats-count__icon"
                  aria-hidden="true"
                />
              )}
              <div 
                className="stats-count__value"
                aria-live="polite"
                aria-atomic="true"
              >
                {getDisplayValue(stat, counters[index])}
              </div>
              <div className="stats-count__label">
                {stat.label}
              </div>
            </div>
            
            {showDividers && index < stats.length - 1 && (
              <div className="stats-count__divider" aria-hidden="true" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StatsCount;
