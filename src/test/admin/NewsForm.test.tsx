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

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({ value, onChange }: any) => (
    <textarea aria-label="Conteúdo" value={value} onChange={e => onChange(e.target.value)} />
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, name }: any) => (
    <select aria-label={name} value={value} onChange={e => onValueChange(e.target.value)} name={name}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>
}));

// Supabase mock helpers
const insertAdminNews = vi.fn();
const selectAdminNews = vi.fn();
const singleAdminNews = vi.fn();
const insertNewsApproval = vi.fn();

function fromMock(table: string) {
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
}

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { from: fromMock }
}));

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText(/Título/i), 'Título de teste válido');
  await userEvent.type(screen.getByLabelText(/Resumo/i), 'Resumo de teste com caracteres suficientes.');
  await userEvent.type(screen.getByRole('textbox', { name: /Conteúdo/i }), 'Conteúdo de teste com mais de cinquenta caracteres para passar na validação.');

  await userEvent.selectOptions(screen.getByLabelText('status'), 'pending');
  await userEvent.selectOptions(screen.getByLabelText('category'), 'Política');
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
      expect(insertNewsApproval).toHaveBeenCalled();
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

  it('sanitiza entradas HTML antes de salvar', async () => {
    render(<NewsForm />);

    await fillForm();
    await userEvent.clear(screen.getByLabelText(/Título/i));
    await userEvent.type(
      screen.getByLabelText(/Título/i),
      '<script>alert(1)</script>Título válido'
    );

    await userEvent.click(screen.getByRole('button', { name: /Criar Notícia/i }));

    await waitFor(() => {
      expect(insertAdminNews).toHaveBeenCalled();
    });

    const inserted = insertAdminNews.mock.calls[0][0];
    expect(inserted.title).toBe('Título válido');
    expect(inserted.title).not.toMatch(/<script>/);
  });
});

