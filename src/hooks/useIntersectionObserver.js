import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for scroll-triggered animations using IntersectionObserver
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Intersection threshold (0-1), default: 0.3
 * @param {string} options.rootMargin - Root margin for observer, default: '0px'
 * @param {boolean} options.triggerOnce - Only trigger once, default: true
 * @returns {[React.RefObject<HTMLElement>, boolean, boolean]} - [ref, isVisible, hasTriggered]
 * 
 * @example
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.5 });
 * return <div ref={ref}>{isVisible && <AnimatedContent />}</div>
 */
export const useIntersectionObserver = (options = {}) => {
  const {
    threshold = 0.3,
    rootMargin = '0px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    const isIntersecting = entry.isIntersecting;

    if (isIntersecting) {
      setIsVisible(true);
      setHasTriggered(true);

      // Disconnect observer if triggerOnce is true
      if (triggerOnce && observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    } else if (!triggerOnce) {
      // Only update visibility if not triggerOnce mode
      setIsVisible(false);
    }
  }, [triggerOnce]);

  useEffect(() => {
    const element = elementRef.current;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: immediately trigger for browsers without support
      setIsVisible(true);
      setHasTriggered(true);
      return;
    }

    // Don't create observer if already triggered in triggerOnce mode
    if (triggerOnce && hasTriggered) {
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    // Start observing
    if (element) {
      observerRef.current.observe(element);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered, handleIntersection]);

  return [elementRef, isVisible, hasTriggered];
};

export default useIntersectionObserver;
