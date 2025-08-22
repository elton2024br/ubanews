import { render, screen, waitFor } from '../utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NewsForm } from '@/admin/pages/NewsForm';
import { toast } from 'sonner';

// Mock admin context
vi.mock('@/admin/context/AdminProvider', () => ({
  useAdmin: () => ({ user: { id: 'user-1', role: 'editor', email: 'user@example.com', full_name: 'User' } })
}));

// Mock router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({})
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

// Supabase mock helpers
const insertAdminNews = vi.fn();
const selectAdminNews = vi.fn();
const singleAdminNews = vi.fn();
const insertNewsApproval = vi.fn();

const fromMock = vi.fn((table: string) => {
  if (table === 'admin_news') {
    return {
      insert: insertAdminNews.mockReturnValue({
        select: selectAdminNews.mockReturnValue({
          single: singleAdminNews.mockResolvedValue({ data: { id: 'new-id' }, error: null })
        })
      })
    } as any;
  }
  if (table === 'news_approvals') {
    return {
      insert: insertNewsApproval.mockResolvedValue({ error: null })
    } as any;
  }
  return {} as any;
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { from: fromMock }
}));

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText(/Título/i), 'Título de teste válido');
  await userEvent.type(screen.getByLabelText(/Resumo/i), 'Resumo de teste com caracteres suficientes.');
  await userEvent.type(screen.getByLabelText(/Conteúdo/i), 'Conteúdo de teste com mais de cinquenta caracteres para passar na validação.');

  await userEvent.click(screen.getByText('Selecione o status'));
  await userEvent.click(screen.getByText('Pendente'));

  await userEvent.click(screen.getByText('Selecione a categoria'));
  await userEvent.click(screen.getByText('Política'));
};

describe('NewsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia notícia para aprovação quando status é pendente', async () => {
    render(<NewsForm />);
    await fillForm();

    await userEvent.click(screen.getByRole('button', { name: /Criar Notícia/i }));

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('news_approvals');
    });

    expect(insertNewsApproval).toHaveBeenCalledWith({
      news_id: 'new-id',
      reviewer_id: 'user-1',
      status: 'pending',
      comments: ''
    });
    expect(toast.success).toHaveBeenCalledWith('Notícia criada e enviada para aprovação');
  });

  it('mostra erro se falhar ao criar aprovação', async () => {
    insertNewsApproval.mockResolvedValueOnce({ error: { message: 'fail' } });

    render(<NewsForm />);
    await fillForm();

    await userEvent.click(screen.getByRole('button', { name: /Criar Notícia/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao enviar notícia para aprovação');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

