import { useState, useEffect, useCallback, useRef } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './TypeAnimation.css';

/**
 * TypeAnimation Component
 * 
 * Displays text with a typing effect, rotating through multiple phrases.
 * Supports typing, deleting, and cursor blinking animations.
 * 
 * @param {Object} props - Component props
 * @param {string[]} props.texts - Array of texts to rotate through
 * @param {number} [props.typingSpeed=75] - Typing speed in ms per character
 * @param {number} [props.deletingSpeed=50] - Deleting speed in ms per character
 * @param {number} [props.pauseDuration=2000] - Pause duration between texts in ms
 * @param {boolean} [props.loop=true] - Whether to loop infinitely
 * @param {boolean} [props.showCursor=true] - Whether to show cursor
 * @param {string} [props.cursorCharacter='|'] - Cursor character
 * @param {string} [props.className=''] - Additional CSS class
 * @param {Function} [props.onComplete] - Callback when animation completes (if loop=false)
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
const TypeAnimation = ({
  texts = [],
  typingSpeed = 75,
  deletingSpeed = 50,
  pauseDuration = 2000,
  loop = true,
  showCursor = true,
  cursorCharacter = '|',
  className = '',
  onComplete
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // State for current display text and animation phase
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Refs for cleanup
  const timeoutRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Get current target text
  const currentText = texts[textIndex] || '';

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Handle typing animation
  const tick = useCallback(() => {
    if (isComplete || texts.length === 0) return;

    // If paused, wait for pause duration
    if (isPaused) {
      timeoutRef.current = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return;
    }

    if (isDeleting) {
      // Deleting phase
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(prev => prev.slice(0, -1));
        }, deletingSpeed);
      } else {
        // Finished deleting, move to next text
        setIsDeleting(false);
        const nextIndex = textIndex + 1;
        
        if (nextIndex >= texts.length) {
          if (loop) {
            setTextIndex(0);
          } else {
            setIsComplete(true);
            onComplete?.();
          }
        } else {
          setTextIndex(nextIndex);
        }
      }
    } else {
      // Typing phase
      if (displayText.length < currentText.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing, pause before deleting
        setIsPaused(true);
      }
    }
  }, [
    displayText,
    currentText,
    isDeleting,
    isPaused,
    isComplete,
    textIndex,
    texts,
    loop,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    onComplete
  ]);

  // Run animation tick
  useEffect(() => {
    // If reduced motion is preferred, show full text immediately
    if (prefersReducedMotion) {
      setDisplayText(currentText);
      return;
    }

    tick();

    return clearTimers;
  }, [tick, prefersReducedMotion, currentText, clearTimers]);

  // Handle reduced motion - show all texts in rotation without animation
  useEffect(() => {
    if (!prefersReducedMotion || texts.length <= 1) return;

    // For reduced motion, just rotate texts without animation
    const interval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % texts.length);
    }, pauseDuration + 1000);

    return () => clearInterval(interval);
  }, [prefersReducedMotion, texts.length, pauseDuration]);

  // Update display text when textIndex changes (for reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(currentText);
    }
  }, [prefersReducedMotion, currentText]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  // Don't render if no texts provided
  if (texts.length === 0) {
    return null;
  }

  return (
    <span className={`type-animation ${className}`}>
      <span className="type-animation__text">{displayText}</span>
      {showCursor && (
        <span 
          className={`type-animation__cursor ${prefersReducedMotion ? '' : 'type-animation__cursor--blinking'}`}
          aria-hidden="true"
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  );
};

export default TypeAnimation;
