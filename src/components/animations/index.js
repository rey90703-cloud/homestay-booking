/**
 * Animation Components - Centralized Exports
 * 
 * This file provides tree-shaking friendly exports for all animation components.
 * Import only what you need to minimize bundle size.
 * 
 * @example
 * // Import specific components
 * import { StatsCount, TypeAnimation } from '@/components/animations';
 * 
 * // Or import all
 * import * as Animations from '@/components/animations';
 * 
 * Requirements: 6.3 - Load only required animation modules to minimize bundle size
 */

// StatsCount - Animated statistics counter
export { default as StatsCount } from './StatsCount/StatsCount';

// TypeAnimation - Typing effect animation
export { default as TypeAnimation } from './TypeAnimation/TypeAnimation';

// AnimatedTestimonials - Testimonial carousel with animations
export { default as AnimatedTestimonials } from './AnimatedTestimonials/AnimatedTestimonials';

// ExpandableCards - Cards with hover expansion effect
export { default as ExpandableCards } from './ExpandableCards/ExpandableCards';

// LogoLoop - Infinite logo scroll animation
export { default as LogoLoop } from './LogoLoop/LogoLoop';

// Note: All animation components are now exported
// Tree-shaking ensures only used components are bundled
