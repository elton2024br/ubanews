import { render, screen, waitFor } from '../utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/admin/auth/LoginPage';
import { toast } from 'sonner';

const mockLogin = vi.fn();

vi.mock('@/admin/context/AdminProvider', () => ({
  useAdmin: () => ({ user: null, login: mockLogin, loading: false })
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    (toast.success as any).mockClear();
    (toast.error as any).mockClear();
  });

  it('realiza login com sucesso', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/Email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/Senha/i), 'senha123');

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'senha123');
    });

    expect(toast.success).toHaveBeenCalled();
    expect(screen.queryByText(/Erro/)).not.toBeInTheDocument();
  });

  it('mostra erro quando login falha', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Credenciais inválidas' });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/Email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/Senha/i), 'errada1');

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'errada1');
    });

    expect(toast.error).toHaveBeenCalled();
    expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
  });

  it('valida formato de email', async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/Email/i), 'invalid');
    await userEvent.type(screen.getByLabelText(/Senha/i), '123456');

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });

    // Validation error prevents submission
  });
});

