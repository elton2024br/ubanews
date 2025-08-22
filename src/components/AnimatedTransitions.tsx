import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  className = '',
  direction = 'up'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransformClass = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return 'translate-y-4';
        case 'down':
          return '-translate-y-4';
        case 'left':
          return 'translate-x-4';
        case 'right':
          return '-translate-x-4';
        default:
          return '';
      }
    }
    return 'translate-y-0 translate-x-0';
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        getTransformClass(),
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  className = ''
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={index * staggerDelay} direction="up">
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

interface ScaleOnHoverProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export const ScaleOnHover: React.FC<ScaleOnHoverProps> = ({
  children,
  scale = 1.02,
  className = ''
}) => {
  return (
    <div
      className={cn(
        'transition-transform duration-200 ease-out hover:scale-[var(--scale)]',
        className
      )}
      style={{ '--scale': scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

interface PulseOnClickProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const PulseOnClick: React.FC<PulseOnClickProps> = ({
  children,
  className = '',
  onClick
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  const handleClick = () => {
    setIsPulsing(true);
    onClick?.();
    
    setTimeout(() => {
      setIsPulsing(false);
    }, 200);
  };

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-out cursor-pointer',
        isPulsing && 'scale-95',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  isVisible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  isVisible,
  direction = 'right',
  className = ''
}) => {
  const getTransformClass = () => {
    if (!isVisible) {
      switch (direction) {
        case 'left':
          return '-translate-x-full';
        case 'right':
          return 'translate-x-full';
        case 'up':
          return '-translate-y-full';
        case 'down':
          return 'translate-y-full';
        default:
          return 'translate-x-full';
      }
    }
    return 'translate-x-0 translate-y-0';
  };

  return (
    <div
      className={cn(
        'transition-transform duration-300 ease-out',
        getTransformClass(),
        className
      )}
    >
      {children}
    </div>
  );
};

interface FloatingActionProps {
  children: React.ReactNode;
  className?: string;
}

export const FloatingAction: React.FC<FloatingActionProps> = ({
  children,
  className = ''
}) => {
  return (
    <div
      className={cn(
        'animate-bounce-subtle hover:animate-none transition-all duration-200',
        'hover:scale-110 hover:shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
};

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  className = '',
  onClick
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);

    onClick?.(e);
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none animate-ripple bg-white/30 rounded-full"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </div>
  );
};