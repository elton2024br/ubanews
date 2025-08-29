import { useEffect, useRef, useState } from 'react';
import {
  meetsWCAGAA,
  validateFormAccessibility,
  isValidTouchTarget,
  announceToScreenReader
} from '@/utils/accessibility';

interface AccessibilityIssue {
  type: 'contrast' | 'form' | 'touch-target' | 'aria' | 'keyboard';
  severity: 'error' | 'warning' | 'info';
  element?: HTMLElement;
  message: string;
  suggestion?: string;
}

interface AccessibilityAuditOptions {
  checkContrast?: boolean;
  checkForms?: boolean;
  checkTouchTargets?: boolean;
  checkAria?: boolean;
  checkKeyboardNav?: boolean;
  announceIssues?: boolean;
}

const defaultOptions: AccessibilityAuditOptions = {
  checkContrast: true,
  checkForms: true,
  checkTouchTargets: true,
  checkAria: true,
  checkKeyboardNav: true,
  announceIssues: false
};

export const useAccessibilityAudit = (
  containerRef: React.RefObject<HTMLElement>,
  options: AccessibilityAuditOptions = defaultOptions
) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const auditTimeoutRef = useRef<NodeJS.Timeout>();

  const auditContrast = (container: HTMLElement): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const elements = container.querySelectorAll('*');
    
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Skip elements with transparent backgrounds
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        return;
      }
      
      // Convert RGB to hex for contrast checking
      const rgbToHex = (rgb: string): string => {
        const match = rgb.match(/\d+/g);
        if (!match) return '#000000';
        const [r, g, b] = match.map(Number);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      };
      
      try {
        const foregroundHex = rgbToHex(color);
        const backgroundHex = rgbToHex(backgroundColor);
        
        const fontSize = parseFloat(computedStyle.fontSize);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && computedStyle.fontWeight === 'bold');
        
        if (!meetsWCAGAA(foregroundHex, backgroundHex, isLargeText)) {
          issues.push({
            type: 'contrast',
            severity: 'error',
            element: htmlElement,
            message: `Contraste insuficiente detectado (${foregroundHex} sobre ${backgroundHex})`,
            suggestion: 'Ajuste as cores para atender aos padrões WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)'
          });
        }
      } catch (error) {
        // Skip elements where color parsing fails
      }
    });
    
    return issues;
  };

  const auditForms = (container: HTMLElement): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const forms = container.querySelectorAll('form');
    
    forms.forEach((form) => {
      const formIssues = validateFormAccessibility(form as HTMLFormElement);
      formIssues.forEach((issue) => {
        issues.push({
          type: 'form',
          severity: 'error',
          element: form as HTMLElement,
          message: issue,
          suggestion: 'Adicione labels apropriados e atributos ARIA para todos os campos de formulário'
        });
      });
    });
    
    return issues;
  };

  const auditTouchTargets = (container: HTMLElement): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );
    
    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      if (!isValidTouchTarget(htmlElement)) {
        issues.push({
          type: 'touch-target',
          severity: 'warning',
          element: htmlElement,
          message: 'Área de toque muito pequena (mínimo recomendado: 44x44px)',
          suggestion: 'Aumente o tamanho do elemento ou adicione padding para melhorar a usabilidade em dispositivos móveis'
        });
      }
    });
    
    return issues;
  };

  const auditAria = (container: HTMLElement): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing ARIA labels on interactive elements
    const interactiveElements = container.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), a:not([aria-label]):not([aria-labelledby])'
    );
    
    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const textContent = htmlElement.textContent?.trim();
      
      if (!textContent || textContent.length < 2) {
        issues.push({
          type: 'aria',
          severity: 'error',
          element: htmlElement,
          message: 'Elemento interativo sem rótulo acessível',
          suggestion: 'Adicione aria-label ou aria-labelledby para descrever a função do elemento'
        });
      }
    });
    
    // Check for missing alt text on images
    const images = container.querySelectorAll('img:not([alt])');
    images.forEach((img) => {
      issues.push({
        type: 'aria',
        severity: 'error',
        element: img as HTMLElement,
        message: 'Imagem sem texto alternativo',
        suggestion: 'Adicione o atributo alt com uma descrição apropriada da imagem'
      });
    });
    
    return issues;
  };

  const auditKeyboardNavigation = (container: HTMLElement): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    
    // Check for elements that should be focusable but aren't
    const clickableElements = container.querySelectorAll(
      '[onclick]:not(button):not(a):not([tabindex])'
    );
    
    clickableElements.forEach((element) => {
      issues.push({
        type: 'keyboard',
        severity: 'error',
        element: element as HTMLElement,
        message: 'Elemento clicável não acessível via teclado',
        suggestion: 'Adicione tabindex="0" e manipuladores de eventos de teclado (onKeyDown)'
      });
    });
    
    return issues;
  };

  const runAudit = () => {
    if (!containerRef.current || isAuditing) return;
    
    setIsAuditing(true);
    const allIssues: AccessibilityIssue[] = [];
    
    try {
      if (options.checkContrast) {
        allIssues.push(...auditContrast(containerRef.current));
      }
      
      if (options.checkForms) {
        allIssues.push(...auditForms(containerRef.current));
      }
      
      if (options.checkTouchTargets) {
        allIssues.push(...auditTouchTargets(containerRef.current));
      }
      
      if (options.checkAria) {
        allIssues.push(...auditAria(containerRef.current));
      }
      
      if (options.checkKeyboardNav) {
        allIssues.push(...auditKeyboardNavigation(containerRef.current));
      }
      
      setIssues(allIssues);
      
      if (options.announceIssues && allIssues.length > 0) {
        const errorCount = allIssues.filter(issue => issue.severity === 'error').length;
        const warningCount = allIssues.filter(issue => issue.severity === 'warning').length;
        
        announceToScreenReader(
          `Auditoria de acessibilidade concluída: ${errorCount} erros e ${warningCount} avisos encontrados`,
          'polite'
        );
      }
    } catch (error) {
      console.error('Erro durante auditoria de acessibilidade:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  // Debounced audit on container changes
  useEffect(() => {
    if (auditTimeoutRef.current) {
      clearTimeout(auditTimeoutRef.current);
    }
    
    auditTimeoutRef.current = setTimeout(() => {
      runAudit();
    }, 500);
    
    return () => {
      if (auditTimeoutRef.current) {
        clearTimeout(auditTimeoutRef.current);
      }
    };
  }, [containerRef.current, options]);

  const getIssuesByType = (type: AccessibilityIssue['type']) => {
    return issues.filter(issue => issue.type === type);
  };

  const getIssuesBySeverity = (severity: AccessibilityIssue['severity']) => {
    return issues.filter(issue => issue.severity === severity);
  };

  const hasErrors = () => {
    return issues.some(issue => issue.severity === 'error');
  };

  const getAccessibilityScore = (): number => {
    if (issues.length === 0) return 100;
    
    const errorWeight = 10;
    const warningWeight = 5;
    const infoWeight = 1;
    
    const totalDeductions = issues.reduce((total, issue) => {
      switch (issue.severity) {
        case 'error': return total + errorWeight;
        case 'warning': return total + warningWeight;
        case 'info': return total + infoWeight;
        default: return total;
      }
    }, 0);
    
    return Math.max(0, 100 - totalDeductions);
  };

  return {
    issues,
    isAuditing,
    runAudit,
    getIssuesByType,
    getIssuesBySeverity,
    hasErrors,
    getAccessibilityScore,
    errorCount: getIssuesBySeverity('error').length,
    warningCount: getIssuesBySeverity('warning').length,
    infoCount: getIssuesBySeverity('info').length
  };
};