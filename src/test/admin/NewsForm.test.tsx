import { render, screen, waitFor, within } from '../utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NewsForm } from '@/admin/pages/NewsForm';
import { toast } from 'sonner';

// Mock admin context
vi.mock('@/admin/context/AdminProvider', () => ({
  useAdmin: () => ({ user: { id: 'user-1', role: 'editor', email: 'user@example.com', full_name: 'User' } })
}));

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({})
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => {
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
      };
    }
    if (table === 'news_approvals') {
      return {
        insert: insertNewsApproval
      };
    }
    return {};
  });

  return {
    supabase: { from: fromMock },
    __test_mocks__: {
      fromMock,
      insertAdminNews,
      selectAdminNews,
      singleAdminNews,
      insertNewsApproval
    }
  };
});

// Import the mocked module to get access to the inner mocks
const { __test_mocks__: supabaseMocks } = await import('@/lib/supabaseClient');
const { fromMock, insertNewsApproval } = supabaseMocks;


const fillForm = async () => {
  await userEvent.type(screen.getByLabelText(/Título/i), 'Título de teste válido');
  await userEvent.type(screen.getByLabelText(/Resumo/i), 'Resumo de teste com caracteres suficientes.');

  // For the rich text editor, we need to find the contenteditable div
  const richTextEditor = screen.getByLabelText(/Conteúdo/i);
  await userEvent.type(richTextEditor, 'Conteúdo de teste com mais de cinquenta caracteres para passar na validação.');

  // Open the Status select
  await userEvent.click(screen.getByRole('combobox', { name: /Status/i }));
  // Select the 'Pendente' option
  await userEvent.click(await screen.findByText('Pendente'));

  // Open the Category select
  await userEvent.click(screen.getByRole('combobox', { name: /Categoria/i }));
  // Select the 'Tecnologia' option
  await userEvent.click(await screen.findByText('Tecnologia'));
};

describe('NewsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set a default resolution for the mock
    insertNewsApproval.mockResolvedValue({ error: null });
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
  });
});
