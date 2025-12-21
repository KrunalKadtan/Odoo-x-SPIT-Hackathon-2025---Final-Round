import React from 'react';
import { useScrollAnimation } from '../utils/lazyLoading';

const ScrollAnimationWrapper = ({ 
  children, 
  animation = 'animate-fade-in-up', 
  delay = 0,
  className = ''
}) => {
  const { elementRef, isVisible } = useScrollAnimation(animation, delay);

  return (
    <div 
      ref={elementRef}
      className={`${className} ${isVisible ? animation : 'opacity-0'}`}
      style={{
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export default ScrollAnimationWrapper;