import { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './ScrollReveal.css';

/**
 * ScrollReveal Component
 * Reveals children with animation when scrolling into viewport
 * Animation replays each time element enters viewport
 */
const ScrollReveal = ({
  children,
  animation = 'fade-up',
  duration = 0.6,
  delay = 0,
  stagger = 0,
  threshold = 0.2,
  className = '',
  // eslint-disable-next-line no-unused-vars
  as: Component = 'div',
  ...props
}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Set visible when entering viewport
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Reset when leaving viewport (allows replay)
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  const style = {
    '--reveal-duration': `${duration}s`,
    '--reveal-delay': `${delay}s`,
    '--stagger-delay': `${stagger}s`,
  };

  return (
    <Component
      ref={ref}
      className={`scroll-reveal scroll-reveal--${animation} ${isVisible ? 'is-visible' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
};

ScrollReveal.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.oneOf([
    'fade-up',
    'fade-down',
    'fade-left',
    'fade-right',
    'scale',
    'bounce',
    'fade'
  ]),
  duration: PropTypes.number,
  delay: PropTypes.number,
  stagger: PropTypes.number,
  threshold: PropTypes.number,
  className: PropTypes.string,
  as: PropTypes.elementType,
};

export default ScrollReveal;
