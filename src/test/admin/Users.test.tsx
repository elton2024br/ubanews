import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { Users } from '@/admin/pages/Users';
import ProtectedRoute from '@/admin/auth/ProtectedRoute';
import { useAdmin } from '@/admin/context/AdminProvider';

vi.mock('@/admin/context/AdminProvider', () => ({
  useAdmin: vi.fn()
}));

const mockedUseAdmin = useAdmin as unknown as ReturnType<typeof vi.fn>;

const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
const fromMock = vi.fn(() => ({ select: selectMock }));
vi.mock('@/lib/supabaseClient', () => ({
  supabase: { from: fromMock }
}));

const renderUsersRoute = () =>
  render(
    <MemoryRouter initialEntries={['/admin/users']}>
      <Routes>
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<div>Página de Login</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('Users page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite acesso para administradores', async () => {
    mockedUseAdmin.mockReturnValue({
      user: { role: 'admin' },
      loading: false,
      logout: vi.fn()
    });
    renderUsersRoute();
    expect(fromMock).toHaveBeenCalledWith('admin_users');
    await waitFor(() => {
      expect(screen.getByText('Gestão de Usuários')).toBeInTheDocument();
    });
  });

  it('bloqueia acesso para usuários não administradores', () => {
    mockedUseAdmin.mockReturnValue({
      user: { role: 'editor' },
      loading: false,
      logout: vi.fn()
    });
    renderUsersRoute();
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
  });
});

