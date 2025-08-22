import { useCallback, useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../utils/accessibility';

// Haptic feedback types
export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification';

// Animation presets
export type AnimationPreset = 
  | 'fadeIn' 
  | 'slideUp' 
  | 'slideDown' 
  | 'slideLeft' 
  | 'slideRight'
  | 'scaleIn'
  | 'scaleOut'
  | 'bounce'
  | 'pulse'
  | 'shake';

// Haptic feedback hook
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    // @ts-expect-error - webkitVibrate is not in TypeScript definitions
    if (navigator.vibrate || navigator.webkitVibrate) {
      const patterns = {
        light: [10],
        medium: [50],
        heavy: [100]
      };
      
      // @ts-expect-error - webkitVibrate is not in TypeScript definitions
      (navigator.vibrate || navigator.webkitVibrate)(patterns[type]);
    }
    
    // For iOS devices with haptic engine
    if ('hapticEngine' in window) {
      try {
        // @ts-expect-error - iOS specific API
        window.hapticEngine.impact(type);
      } catch (error) {
        console.debug('Haptic feedback not available');
      }
    }
  }, []);

  return { triggerHaptic };
};

// Smooth animations hook
export const useSmoothAnimations = () => {
  const reducedMotion = prefersReducedMotion();
  
  const getAnimationClass = useCallback((preset: AnimationPreset, duration = 300) => {
    if (reducedMotion) {
      return 'transition-opacity duration-150';
    }
    
    const durationClass = `duration-${duration}`;
    
    const animations = {
      fadeIn: `animate-in fade-in ${durationClass}`,
      slideUp: `animate-in slide-in-from-bottom-4 ${durationClass}`,
      slideDown: `animate-in slide-in-from-top-4 ${durationClass}`,
      slideLeft: `animate-in slide-in-from-right-4 ${durationClass}`,
      slideRight: `animate-in slide-in-from-left-4 ${durationClass}`,
      scaleIn: `animate-in zoom-in-95 ${durationClass}`,
      scaleOut: `animate-out zoom-out-95 ${durationClass}`,
      bounce: `animate-bounce ${durationClass}`,
      pulse: `animate-pulse ${durationClass}`,
      shake: `animate-pulse ${durationClass}` // Custom shake animation
    };
    
    return animations[preset];
  }, [reducedMotion]);
  
  const createCustomAnimation = useCallback((keyframes: string, duration = 300) => {
    if (reducedMotion) return '';
    
    const animationName = `custom-${Math.random().toString(36).substr(2, 9)}`;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ${animationName} {
        ${keyframes}
      }
      .${animationName} {
        animation: ${animationName} ${duration}ms ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    return animationName;
  }, [reducedMotion]);
  
  return { getAnimationClass, createCustomAnimation, reducedMotion };
};

// Enhanced button interactions
export const useButtonInteractions = () => {
  const { triggerHaptic } = useHapticFeedback();
  const { getAnimationClass } = useSmoothAnimations();
  
  const createButtonProps = useCallback(({
    onClick,
    hapticType = 'light',
    animationPreset = 'scaleIn',
    disabled = false
  }: {
    onClick?: () => void;
    hapticType?: HapticType;
    animationPreset?: AnimationPreset;
    disabled?: boolean;
  }) => {
    return {
      onClick: (e: React.MouseEvent) => {
        if (disabled) return;
        
        triggerHaptic(hapticType);
        onClick?.();
        
        // Add visual feedback
        const target = e.currentTarget as HTMLElement;
        target.classList.add('scale-95');
        setTimeout(() => {
          target.classList.remove('scale-95');
        }, 150);
      },
      onMouseDown: () => {
        if (disabled) return;
        triggerHaptic('selection');
      },
      className: `transition-all duration-150 hover:scale-105 active:scale-95 ${getAnimationClass(animationPreset)}`,
      disabled
    };
  }, [triggerHaptic, getAnimationClass]);
  
  return { createButtonProps };
};

// Loading states with animations
export const useLoadingStates = () => {
  const { getAnimationClass } = useSmoothAnimations();
  
  const createLoadingSpinner = useCallback((size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };
    
    return {
      className: `${sizes[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`,
      'aria-label': 'Carregando...'
    };
  }, []);
  
  const createSkeletonProps = useCallback((variant: 'text' | 'circular' | 'rectangular' = 'text') => {
    const variants = {
      text: 'h-4 bg-gray-200 rounded animate-pulse',
      circular: 'rounded-full bg-gray-200 animate-pulse',
      rectangular: 'bg-gray-200 rounded animate-pulse'
    };
    
    return {
      className: `${variants[variant]} ${getAnimationClass('fadeIn')}`,
      'aria-label': 'Carregando conteúdo...'
    };
  }, [getAnimationClass]);
  
  return { createLoadingSpinner, createSkeletonProps };
};

// Scroll animations
export const useScrollAnimations = () => {
  const { getAnimationClass } = useSmoothAnimations();
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const observeElement = useCallback((element: HTMLElement, animationPreset: AnimationPreset = 'fadeIn') => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              target.classList.add(...getAnimationClass(animationPreset).split(' '));
              observerRef.current?.unobserve(target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );
    }
    
    observerRef.current.observe(element);
  }, [getAnimationClass]);
  
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
  
  return { observeElement };
};

// Toast notifications with animations
export const useToastAnimations = () => {
  const { getAnimationClass } = useSmoothAnimations();
  const { triggerHaptic } = useHapticFeedback();
  
  const createToastProps = useCallback((type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const typeStyles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    const hapticTypes: Record<string, HapticType> = {
      success: 'light',
      error: 'heavy',
      warning: 'medium',
      info: 'light'
    };
    
    // Trigger haptic feedback for toast
    triggerHaptic(hapticTypes[type]);
    
    return {
      className: `${typeStyles[type]} ${getAnimationClass('slideDown')} border rounded-lg p-4 shadow-lg`,
      role: 'alert',
      'aria-live': type === 'error' ? 'assertive' : 'polite'
    };
  }, [getAnimationClass, triggerHaptic]);
  
  return { createToastProps };
};

// Card hover effects
export const useCardInteractions = () => {
  const { getAnimationClass } = useSmoothAnimations();
  const { triggerHaptic } = useHapticFeedback();
  
  const createCardProps = useCallback(({
    interactive = true,
    hapticOnHover = false
  }: {
    interactive?: boolean;
    hapticOnHover?: boolean;
  } = {}) => {
    if (!interactive) {
      return {
        className: getAnimationClass('fadeIn')
      };
    }
    
    return {
      className: `${getAnimationClass('fadeIn')} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`,
      onMouseEnter: () => {
        if (hapticOnHover) {
          triggerHaptic('selection');
        }
      },
      tabIndex: 0,
      role: 'button'
    };
  }, [getAnimationClass, triggerHaptic]);
  
  return { createCardProps };
};

// Form field interactions
export const useFormInteractions = () => {
  const { triggerHaptic } = useHapticFeedback();
  const { getAnimationClass } = useSmoothAnimations();
  
  const createFieldProps = useCallback(({
    hasError = false,
    isRequired = false
  }: {
    hasError?: boolean;
    isRequired?: boolean;
  } = {}) => {
    return {
      className: `${getAnimationClass('fadeIn')} transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${hasError ? 'border-red-500 shake' : 'border-gray-300'}`,
      onFocus: () => {
        triggerHaptic('selection');
      },
      onInvalid: () => {
        if (hasError) {
          triggerHaptic('heavy');
        }
      },
      'aria-required': isRequired,
      'aria-invalid': hasError
    };
  }, [triggerHaptic, getAnimationClass]);
  
  return { createFieldProps };
};

// Page transition animations
export const usePageTransitions = () => {
  const { getAnimationClass } = useSmoothAnimations();
  
  const createPageProps = useCallback((direction: 'enter' | 'exit' = 'enter') => {
    const animations = {
      enter: getAnimationClass('slideRight', 400),
      exit: getAnimationClass('slideLeft', 300)
    };
    
    return {
      className: animations[direction]
    };
  }, [getAnimationClass]);
  
  return { createPageProps };
};