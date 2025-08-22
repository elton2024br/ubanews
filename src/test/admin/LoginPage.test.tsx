import { fireEvent, render, screen, waitFor } from '../utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'user@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'senha' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'senha');
    });

    expect(toast.success).toHaveBeenCalled();
    expect(screen.queryByText(/Erro/)).not.toBeInTheDocument();
  });

  it('mostra erro quando login falha', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Credenciais inválidas' });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'user@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'errada' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'errada');
    });

    expect(toast.error).toHaveBeenCalled();
    expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
  });
});

