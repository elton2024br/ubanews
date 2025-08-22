import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Pular para o conteúdo principal' },
  { href: '#navigation', label: 'Pular para a navegação' },
  { href: '#search', label: 'Pular para a busca' },
  { href: '#footer', label: 'Pular para o rodapé' },
];

const SkipLinks: React.FC<SkipLinksProps> = ({ 
  links = defaultLinks, 
  className 
}) => {
  return (
    <div 
      className={cn(
        'sr-only focus-within:not-sr-only',
        'fixed top-0 left-0 z-[9999]',
        'bg-background border border-border rounded-br-lg shadow-lg',
        'p-2',
        className
      )}
      role="navigation"
      aria-label="Links de navegação rápida"
    >
      <ul className="flex flex-col gap-1">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              className={cn(
                'inline-flex items-center px-3 py-2 text-sm font-medium',
                'text-foreground bg-background',
                'border border-border rounded-md',
                'transition-colors duration-200',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'focus:bg-accent focus:text-accent-foreground',
                'whitespace-nowrap'
              )}
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(link.href);
                if (target) {
                  target.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                  // Focus the target element if it's focusable
                  if (target instanceof HTMLElement) {
                    target.focus({ preventScroll: true });
                  }
                }
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SkipLinks;