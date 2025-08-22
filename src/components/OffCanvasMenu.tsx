import React from 'react';
import { X, Home, Newspaper, Users, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface OffCanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Newspaper, label: 'Notícias', href: '/noticias' },
  { icon: Users, label: 'Política', href: '/politica' },
  { icon: MapPin, label: 'Turismo', href: '/turismo' },
  { icon: Phone, label: 'Contato', href: '/contato' },
];

export function OffCanvasMenu({ isOpen, onClose }: OffCanvasMenuProps) {
  // Handle escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus management
  const menuRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Off-canvas menu */}
      <div
        ref={menuRef}
        className={cn(
          'fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-background border-r shadow-xl z-50',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="menu-title" className="text-lg font-semibold text-foreground">
            Menu
          </h2>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg',
                      'text-foreground hover:bg-accent hover:text-accent-foreground',
                      'transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      'touch-manipulation min-h-[44px]' // Touch-friendly target size
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeToggle variant="mobile" />
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>© 2024 Ubatuba Reage</p>
            <p>Notícias locais em tempo real</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default OffCanvasMenu;