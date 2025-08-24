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
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
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
    fireEvent.change(screen.getByLabelText(/Código 2FA/i), {
      target: { value: '123456' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'senha', '123456');
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
    fireEvent.change(screen.getByLabelText(/Código 2FA/i), {
      target: { value: '000000' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'errada', '000000');
    });

    expect(toast.error).toHaveBeenCalled();
    expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
  });
});

