import React, { useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminProvider';
import { Button } from '../../components/ui/button';
import { generateAriaLabel, announceToScreenReader } from '../../utils/accessibility';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import {
  LayoutDashboard,
  FileText,
  Users,
  Activity,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  Newspaper,
  ChevronDown,
  Shield,
  CheckCircle,
  Clock,
  BarChart3,
  User,
  Gauge,
  Home,
  Plus,
  PenTool,
  TrendingUp,
  MessageSquare,
  Mail
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  allowedRoles?: ('admin' | 'columnist' | 'editor')[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Notícias',
    href: '/admin/news',
    icon: FileText,
    requiredPermission: { resource: 'news', action: 'read' },
  },
  {
    name: 'Aprovações',
    href: '/admin/approvals',
    icon: CheckCircle,
    allowedRoles: ['admin', 'editor'],
  },
  {
    name: 'Relatórios',
    href: '/admin/reports',
    icon: BarChart3,
    allowedRoles: ['admin', 'editor'],
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    allowedRoles: ['admin', 'editor'],
  },
  {
    name: 'Comentários',
    href: '/admin/comments',
    icon: MessageSquare,
    allowedRoles: ['admin', 'editor'],
  },
  {
    name: 'Newsletter',
    href: '/admin/newsletter',
    icon: Mail,
    allowedRoles: ['admin', 'editor'],
  },
  {
    name: 'Usuários',
    href: '/admin/users',
    icon: Users,
    allowedRoles: ['admin'],
  },
  {
    name: 'Logs de Auditoria',
    href: '/admin/audit',
    icon: Activity,
    allowedRoles: ['admin', 'editor'],
  },
  {
    name: 'Configurações',
    href: '/admin/settings',
    icon: Settings,
    allowedRoles: ['admin'],
  },
];

export const AdminLayout: React.FC = () => {
  const { user, logout, hasPermission } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const handleLogout = async () => {
    announceToScreenReader('Fazendo logout...');
    await logout();
    announceToScreenReader('Logout realizado com sucesso');
    navigate('/admin/login');
  };

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    announceToScreenReader(newState ? 'Menu lateral aberto' : 'Menu lateral fechado');
  };

  const handleNavigation = (itemName: string, href: string) => {
    announceToScreenReader(`Navegando para ${itemName}`);
    navigate(href);
    setSidebarOpen(false);
  };

  const filteredNavigation = navigation.filter(item => {
    if (item.allowedRoles && !item.allowedRoles.includes(user?.role || 'columnist')) {
      return false;
    }
    if (item.requiredPermission) {
      const { resource, action } = item.requiredPermission;
      if (!hasPermission(resource, action)) {
        return false;
      }
    }
    return true;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'columnist':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col" ref={sidebarRef}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6" role="banner">
        <Link 
          to="/admin" 
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
          aria-label={generateAriaLabel('Ir para dashboard principal do painel administrativo')}
        >
          <div className="bg-blue-600 rounded-lg p-2">
            <Newspaper className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">UbaNews</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b bg-gray-50" role="region" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ações Rápidas</h2>
        <div className="space-y-2" role="group" aria-labelledby="quick-actions-title">
          {/* Voltar para página inicial */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              announceToScreenReader('Abrindo página inicial em nova aba');
              window.open('/', '_blank');
              setSidebarOpen(false);
            }}
            className="w-full justify-start hover:bg-blue-50 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={generateAriaLabel('Abrir página inicial do site em nova aba')}
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Página Inicial
          </Button>

          {/* Criar notícia */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => {
              announceToScreenReader('Navegando para criação de nova notícia');
              navigate('/admin/news/new');
              setSidebarOpen(false);
            }}
            className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={generateAriaLabel('Criar nova notícia')}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Criar Notícia
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4" role="navigation" aria-label="Menu principal de administração">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => {
                announceToScreenReader(`Navegando para ${item.name}`);
                setSidebarOpen(false);
              }}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={generateAriaLabel(`${item.name}${isActive ? ' (página atual)' : ''}${item.badge ? ` - ${item.badge} itens` : ''}`)}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.name}
              {item.badge && (
                <Badge variant="secondary" className="ml-auto" aria-label={`${item.badge} itens`}>
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t p-4" role="contentinfo" aria-labelledby="user-info-title">
        <h3 id="user-info-title" className="sr-only">Informações do usuário</h3>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8" role="img" aria-label={`Avatar de ${user?.name}`}>
            <AvatarImage src={user?.avatar} alt={`Foto de perfil de ${user?.name}`} />
            <AvatarFallback aria-label={`Iniciais de ${user?.name}`}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" aria-label={`Nome do usuário: ${user?.name}`}>
              {user?.name}
            </p>
            <Badge 
              className={cn('text-xs', getRoleBadgeColor(user?.role || ''))}
              aria-label={`Função: ${user?.role}`}
            >
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={(open) => {
        setSidebarOpen(open);
        announceToScreenReader(open ? 'Menu lateral aberto' : 'Menu lateral fechado');
      }}>
        <SheetContent 
          side="left" 
          className="p-0 w-64"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-sidebar-title"
        >
          <SheetHeader className="sr-only">
            <SheetTitle id="mobile-sidebar-title">Menu de Administração</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6" role="banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleSidebarToggle}
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
                aria-label={generateAriaLabel('Abrir menu de navegação')}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Menu</span>
              </Button>

              {/* Page title */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900" id="page-title">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Admin'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Actions */}
              <div className="flex items-center space-x-2" role="toolbar" aria-label="Ações rápidas">
                {/* Voltar para página inicial */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    announceToScreenReader('Abrindo página inicial em nova aba');
                    window.open('/', '_blank');
                  }}
                  className="hidden sm:flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={generateAriaLabel('Abrir página inicial do site em nova aba')}
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">Página Inicial</span>
                </Button>

                {/* Criar notícia */}
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => {
                    announceToScreenReader('Navegando para criação de nova notícia');
                    navigate('/admin/news/new');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={generateAriaLabel('Criar nova notícia')}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">Criar Notícia</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-6 w-px bg-gray-300" />

              {/* Search */}
              <Button 
                variant="ghost" 
                size="sm"
                className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={generateAriaLabel('Abrir busca')}
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Buscar</span>
              </Button>

              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={generateAriaLabel('Notificações - 3 não lidas')}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center" aria-label="3 notificações não lidas">
                  3
                </span>
                <span className="sr-only">Notificações</span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 px-3 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={generateAriaLabel(`Menu do usuário ${user?.name}`)}
                    aria-haspopup="menu"
                  >
                    <Avatar className="h-8 w-8" role="img" aria-label={`Avatar de ${user?.name}`}>
                      <AvatarImage src={user?.avatar} alt={`Foto de perfil de ${user?.name}`} />
                      <AvatarFallback aria-label={`Iniciais de ${user?.name}`}>
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" role="menu" aria-labelledby="user-menu-button">
                  <DropdownMenuLabel role="none">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge className={cn('text-xs w-fit', getRoleBadgeColor(user?.role || ''))} aria-label={`Função: ${user?.role}`}>
                        <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem role="menuitem" className="focus:bg-gray-100">
                    <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    role="menuitem"
                    aria-label={generateAriaLabel('Fazer logout da conta')}
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main 
          className="flex-1 overflow-auto" 
          role="main" 
          aria-labelledby="page-title"
          ref={mainContentRef}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;