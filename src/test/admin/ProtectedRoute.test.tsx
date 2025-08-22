import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '@/admin/auth/ProtectedRoute';
import { useAdmin } from '@/admin/context/AdminProvider';

vi.mock('@/admin/context/AdminProvider', () => ({
  useAdmin: vi.fn()
}));

const mockedUseAdmin = useAdmin as unknown as ReturnType<typeof vi.fn>;

const renderWithRoutes = () => {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRole="admin">
              <div>Conteúdo Seguro</div>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<div>Página de Login</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe carregamento enquanto verifica autenticação', () => {
    mockedUseAdmin.mockReturnValue({ user: null, loading: true });
    renderWithRoutes();
    expect(screen.getByText('Verificando autenticação...')).toBeInTheDocument();
  });

  it('redireciona usuários não autenticados para login', () => {
    mockedUseAdmin.mockReturnValue({ user: null, loading: false });
    renderWithRoutes();
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
  });

  it('bloqueia acesso quando usuário não possui permissão', () => {
    mockedUseAdmin.mockReturnValue({ user: { role: 'editor' }, loading: false, logout: vi.fn() });
    renderWithRoutes();
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
  });

  it('renderiza conteúdo quando usuário possui permissão', () => {
    mockedUseAdmin.mockReturnValue({ user: { role: 'admin' }, loading: false, logout: vi.fn() });
    renderWithRoutes();
    expect(screen.getByText('Conteúdo Seguro')).toBeInTheDocument();
  });
});

