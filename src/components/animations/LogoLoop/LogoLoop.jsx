/**
 * LogoLoop Component - Infinite logo scroll animation
 * 
 * Displays partner/payment provider logos in a continuous horizontal loop
 * with smooth animation and hover pause functionality.
 * 
 * @example
 * <LogoLoop
 *   logos={[
 *     { src: "/logo1.png", alt: "Partner 1", href: "https://partner1.com" },
 *     { node: <IconComponent />, title: "Partner 2" }
 *   ]}
 *   speed={80}
 *   pauseOnHover
 *   fadeOut
 * />
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * - 5.1: Display partner logos in continuous horizontal loop
 * - 5.2: Scroll logos smoothly at consistent speed (50-100px/s)
 * - 5.3: Pause or slow down animation on hover
 * - 5.4: Seamless loop without visible jump
 * - 5.5: Maintain consistent logo heights and spacing
 */

import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './LogoLoop.css';

// Animation configuration constants
const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,      // Smoothing factor for velocity transitions
  MIN_COPIES: 2,         // Minimum number of logo sequence copies
  COPY_HEADROOM: 2       // Extra copies for seamless looping
};

/**
 * Convert value to CSS length string
 * @param {number|string} value - Value to convert
 * @returns {string|undefined} CSS length value
 */
const toCssLength = (value) => {
  if (typeof value === 'number') return `${value}px`;
  return value ?? undefined;
};

/**
 * Custom hook for ResizeObserver with fallback
 */
const useResizeObserver = (callback, elements, dependencies) => {
  useEffect(() => {
    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback();
      return () => window.removeEventListener('resize', handleResize);
    }

    const observers = elements.map((ref) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });

    callback();

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [callback, ...dependencies]);
};

/**
 * Custom hook for image loading detection
 */
const useImageLoader = (seqRef, onLoad, dependencies) => {
  useEffect(() => {
    const images = seqRef.current?.querySelectorAll('img') ?? [];
    
    if (images.length === 0) {
      onLoad();
      return;
    }

    let remainingImages = images.length;

    const handleImageLoad = () => {
      remainingImages -= 1;
      if (remainingImages === 0) onLoad();
    };

    images.forEach((img) => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener('load', handleImageLoad, { once: true });
        img.addEventListener('error', handleImageLoad, { once: true });
      }
    });

    return () => {
      images.forEach((img) => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, [onLoad, seqRef, ...dependencies]);
};

/**
 * Custom hook for animation loop using requestAnimationFrame
 * Uses GPU-accelerated transform for smooth 60fps performance
 */
const useAnimationLoop = (
  trackRef,
  targetVelocity,
  seqWidth,
  isHovered,
  hoverSpeed,
  isPaused
) => {
  const rafRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || isPaused) return;

    // Initialize position
    if (seqWidth > 0) {
      offsetRef.current = ((offsetRef.current % seqWidth) + seqWidth) % seqWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }

    const animate = (timestamp) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = Math.max(0, timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      // Determine target velocity based on hover state
      const target = isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;

      // Smooth velocity transition using exponential easing
      const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easingFactor;

      // Update position with seamless wrapping
      if (seqWidth > 0) {
        let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
        nextOffset = ((nextOffset % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = nextOffset;

        // Use transform for GPU acceleration (Requirement 7.3)
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [targetVelocity, seqWidth, isHovered, hoverSpeed, isPaused, trackRef]);
};

/**
 * LogoLoop Component
 * 
 * @param {Object} props
 * @param {Array} props.logos - Array of logo items (src/node, alt, title, href)
 * @param {number} props.speed - Animation speed in px/s (default: 80)
 * @param {'left'|'right'} props.direction - Scroll direction (default: 'left')
 * @param {number} props.logoHeight - Height of logos in px (default: 32)
 * @param {number} props.gap - Gap between logos in px (default: 40)
 * @param {boolean} props.pauseOnHover - Pause animation on hover (default: true)
 * @param {boolean} props.fadeOut - Show fade effect at edges (default: true)
 * @param {string} props.fadeOutColor - Color for fade effect
 * @param {string} props.className - Additional CSS class
 * @param {string} props.ariaLabel - Accessibility label
 */
export const LogoLoop = memo(({
  logos = [],
  speed = 80,
  direction = 'left',
  logoHeight = 32,
  gap = 40,
  pauseOnHover = true,
  fadeOut = true,
  fadeOutColor,
  className,
  ariaLabel = 'Đối tác và nhà cung cấp thanh toán'
}) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const seqRef = useRef(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
  const [isHovered, setIsHovered] = useState(false);

  // Check for reduced motion preference (Requirement 6.4, 6.5)
  const prefersReducedMotion = useReducedMotion();

  // Calculate hover speed (0 = pause, undefined = no change)
  const effectiveHoverSpeed = useMemo(() => {
    if (pauseOnHover) return 0;
    return undefined;
  }, [pauseOnHover]);

  // Calculate target velocity based on direction
  const targetVelocity = useMemo(() => {
    const magnitude = Math.abs(speed);
    const directionMultiplier = direction === 'left' ? 1 : -1;
    return magnitude * directionMultiplier;
  }, [speed, direction]);

  // Update dimensions and calculate required copies for seamless loop
  const updateDimensions = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const sequenceRect = seqRef.current?.getBoundingClientRect?.();
    const sequenceWidth = sequenceRect?.width ?? 0;

    if (sequenceWidth > 0) {
      setSeqWidth(Math.ceil(sequenceWidth));
      // Calculate copies needed to fill viewport + headroom for seamless loop
      const copiesNeeded = Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
    }
  }, []);

  // Observe container and sequence for size changes
  useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight]);

  // Wait for images to load before calculating dimensions
  useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight]);

  // Run animation loop (paused if reduced motion is preferred)
  useAnimationLoop(
    trackRef,
    targetVelocity,
    seqWidth,
    isHovered,
    effectiveHoverSpeed,
    prefersReducedMotion
  );

  // CSS custom properties for styling
  const cssVariables = useMemo(() => ({
    '--logoloop-gap': `${gap}px`,
    '--logoloop-logoHeight': `${logoHeight}px`,
    ...(fadeOutColor && { '--logoloop-fadeColor': fadeOutColor })
  }), [gap, logoHeight, fadeOutColor]);

  // Build class name
  const rootClassName = useMemo(() => [
    'logoloop',
    'logoloop--horizontal',
    fadeOut && 'logoloop--fade',
    prefersReducedMotion && 'logoloop--reduced-motion',
    className
  ].filter(Boolean).join(' '), [fadeOut, prefersReducedMotion, className]);

  // Hover handlers
  const handleMouseEnter = useCallback(() => {
    if (effectiveHoverSpeed !== undefined) setIsHovered(true);
  }, [effectiveHoverSpeed]);

  const handleMouseLeave = useCallback(() => {
    if (effectiveHoverSpeed !== undefined) setIsHovered(false);
  }, [effectiveHoverSpeed]);

  // Render individual logo item
  const renderLogoItem = useCallback((item, key) => {
    const isNodeItem = 'node' in item;

    const content = isNodeItem ? (
      <span className="logoloop__node" aria-hidden={!!item.href}>
        {item.node}
      </span>
    ) : (
      <img
        src={item.src}
        alt={item.alt ?? ''}
        title={item.title}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    );

    const itemAriaLabel = isNodeItem 
      ? (item.ariaLabel ?? item.title) 
      : (item.alt ?? item.title);

    const itemContent = item.href ? (
      <a
        className="logoloop__link"
        href={item.href}
        aria-label={itemAriaLabel || 'Logo link'}
        target="_blank"
        rel="noreferrer noopener"
      >
        {content}
      </a>
    ) : content;

    return (
      <li className="logoloop__item" key={key} role="listitem">
        {itemContent}
      </li>
    );
  }, []);

  // Generate logo lists (multiple copies for seamless loop)
  const logoLists = useMemo(() => 
    Array.from({ length: copyCount }, (_, copyIndex) => (
      <ul
        className="logoloop__list"
        key={`copy-${copyIndex}`}
        role="list"
        aria-hidden={copyIndex > 0}
        ref={copyIndex === 0 ? seqRef : undefined}
      >
        {logos.map((item, itemIndex) => 
          renderLogoItem(item, `${copyIndex}-${itemIndex}`)
        )}
      </ul>
    )), [copyCount, logos, renderLogoItem]);

  // Don't render if no logos
  if (!logos || logos.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={rootClassName}
      style={cssVariables}
      role="region"
      aria-label={ariaLabel}
    >
      <div
        className="logoloop__track"
        ref={trackRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {logoLists}
      </div>
    </div>
  );
});

LogoLoop.displayName = 'LogoLoop';

export default LogoLoop;
