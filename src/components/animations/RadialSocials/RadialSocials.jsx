'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import './RadialSocials.css';

const RadialSocialsContext = createContext(null);

const useRadialSocials = () => {
  const context = useContext(RadialSocialsContext);
  if (!context) {
    throw new Error('RadialSocials components must be used within RadialSocials');
  }
  return context;
};

// RadialIcon Component
const RadialIcon = React.forwardRef(({ 
  icon, 
  className = '', 
  radius = 80, 
  iconIndex = 0, 
  circleIndex = 0, 
  totalIcons = 1, 
  globalIconIndex = 0, 
  duration = 20, 
  angle,
  ...props 
}, ref) => {
  const { animatedIcons, expandDuration, calculatePosition, rotationStarted } = useRadialSocials();
  const iconAngle = angle !== undefined ? angle : (360 / totalIcons) * iconIndex;
  const position = calculatePosition(radius, iconAngle);
  const isAnimated = animatedIcons.has(globalIconIndex.toString());

  return (
    <div
      ref={ref}
      className="radial-icon-wrapper"
      style={{
        transform: isAnimated 
          ? `translate(${position.x}px, ${position.y}px) scale(1)`
          : 'translate(0px, 0px) scale(0)',
        transition: `transform ${expandDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
        opacity: isAnimated ? 1 : 0
      }}
      {...props}
    >
      <div
        className={`radial-icon-inner ${className}`}
        style={{
          animation: rotationStarted ? `counter-rotate-${circleIndex} ${duration}s linear infinite` : 'none'
        }}
      >
        <div className="radial-icon-content">
          {icon}
        </div>
      </div>
    </div>
  );
});

RadialIcon.displayName = 'RadialIcon';


// RadialCircular Component
const RadialCircular = React.forwardRef(({ 
  children, 
  radius, 
  duration = 20, 
  className = '', 
  circleLineClassName = '', 
  circleIndex = 0, 
  globalIconStartIndex = 0, 
  startAngle = 0,
  ...props 
}, ref) => {
  const { rotationStarted } = useRadialSocials();
  
  const icons = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.type === RadialIcon
  );

  return (
    <div ref={ref} className="radial-circular-container" {...props}>
      {/* Circle border */}
      <div 
        className={`radial-circle-line ${circleLineClassName} ${className}`}
        style={{
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          marginLeft: `-${radius}px`,
          marginTop: `-${radius}px`,
        }}
      />
      
      {/* Rotating container for icons */}
      <div
        className="radial-icons-container"
        style={{
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          marginLeft: `-${radius}px`,
          marginTop: `-${radius}px`,
          animation: rotationStarted ? `rotate-${circleIndex} ${duration}s linear infinite` : 'none'
        }}
      >
        {React.Children.map(children, (child, iconIndex) => {
          if (React.isValidElement(child) && child.type === RadialIcon) {
            const baseAngle = startAngle + (360 / icons.length) * iconIndex;
            return React.cloneElement(child, { 
              radius,
              iconIndex,
              circleIndex,
              totalIcons: icons.length,
              globalIconIndex: globalIconStartIndex + iconIndex, 
              duration,
              angle: child.props.angle !== undefined ? child.props.angle : baseAngle,
              key: `${circleIndex}-${iconIndex}`
            });
          }
          return child;
        })}
      </div>
    </div>
  );
});

RadialCircular.displayName = 'RadialCircular';


// RadialSocialsContent Component
const RadialSocialsContent = React.forwardRef(({ 
  children, 
  className = '', 
  containerClassName = '', 
  setTotalIcons,
  ...props 
}, ref) => {
  const circles = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.type === RadialCircular
  );

  useEffect(() => {
    let totalIconCount = 0;
    circles.forEach(circle => {
      const icons = React.Children.toArray(circle.props.children).filter(
        child => React.isValidElement(child) && child.type === RadialIcon
      );
      totalIconCount += icons.length;
    });
    if (setTotalIcons) {
      setTotalIcons(totalIconCount);
    }
  }, [children, setTotalIcons, circles]);

  let cumulativeIconCount = 0;
  const circlesWithIconCount = circles.map(circle => {
    const icons = React.Children.toArray(circle.props.children).filter(
      child => React.isValidElement(child) && child.type === RadialIcon
    );
    const startIndex = cumulativeIconCount;
    cumulativeIconCount += icons.length;
    return { circle, startIndex, iconCount: icons.length };
  });

  // Generate keyframes CSS
  const keyframesCSS = circles.map((_, index) => `
    @keyframes rotate-${index} {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes counter-rotate-${index} {
      from { transform: rotate(0deg); }
      to { transform: rotate(-360deg); }
    }
  `).join('\n');

  return (
    <>
      <div ref={ref} className={`radial-content-wrapper ${containerClassName}`} {...props}>
        <div className={`radial-content-inner ${className}`}>
          {circlesWithIconCount.map(({ circle, startIndex }, circleIndex) => {
            return React.cloneElement(circle, { 
              circleIndex,
              globalIconStartIndex: startIndex,
              key: circleIndex 
            });
          })}
        </div>
      </div>
      <style>{keyframesCSS}</style>
    </>
  );
});

RadialSocialsContent.displayName = 'RadialSocialsContent';


// RadialSocials Main Component
const RadialSocials = React.forwardRef(({ 
  children, 
  className = '', 
  animationDelay = 150, 
  expandDuration = 800,
  ...props 
}, ref) => {
  const [animatedIcons, setAnimatedIcons] = useState(new Set());
  const [rotationStarted, setRotationStarted] = useState(false);
  const [totalIcons, setTotalIcons] = useState(0);

  const calculatePosition = (radius, angle) => {
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  useEffect(() => {
    if (totalIcons > 0) {
      setAnimatedIcons(new Set());
      
      Array.from({ length: totalIcons }, (_, index) => index).forEach((index) => {
        setTimeout(() => {
          setAnimatedIcons(prev => new Set([...prev, index.toString()]));
        }, index * animationDelay);
      });

      const totalAnimationTime = totalIcons * animationDelay + expandDuration;
      setTimeout(() => {
        setRotationStarted(true);
      }, totalAnimationTime);
    }
  }, [totalIcons, animationDelay, expandDuration]);

  const contextValue = {
    animatedIcons,
    rotationStarted,
    animationDelay,
    expandDuration,
    calculatePosition
  };

  return (
    <RadialSocialsContext.Provider value={contextValue}>
      <div ref={ref} className={`radial-socials ${className}`} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { setTotalIcons });
          }
          return child;
        })}
      </div>
    </RadialSocialsContext.Provider>
  );
});

RadialSocials.displayName = 'RadialSocials';

export {
  RadialSocials,
  RadialSocialsContent,
  RadialCircular,
  RadialIcon,
};

export default RadialSocials;
