import { render, screen } from '../../utils';
import { vi, describe, it, expect } from 'vitest';
import UserTable from '@/admin/pages/components/UserTable';
import { User } from '@/admin/types/admin';

// Mock the useUsers hook
vi.mock('../../../admin/hooks/useUsers', () => ({
  useUsers: vi.fn(),
}));

// Import the mocked hook after mocking
import { useUsers } from '@/admin/hooks/useUsers';

const mockUseUsers = useUsers as jest.Mock;

describe('UserTable', () => {
  it('should render a loading state correctly', () => {
    // Arrange
    mockUseUsers.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    // Act
    render(<UserTable />);

    // Assert
    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should render an error state correctly', () => {
    // Arrange
    mockUseUsers.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    // Act
    render(<UserTable />);

    // Assert
    expect(screen.getByText('Erro ao Carregar Usuários')).toBeInTheDocument();
    expect(screen.getByText('Detalhes: Failed to fetch')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should render an empty state correctly', () => {
    // Arrange
    mockUseUsers.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    // Act
    render(<UserTable />);

    // Assert
    expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should render the user data correctly', () => {
    // Arrange
    const mockUsersData: Partial<User>[] = [
      { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', is_active: true, two_factor_enabled: false, created_at: new Date().toISOString() },
      { id: '2', name: 'Bob', email: 'bob@example.com', role: 'editor', is_active: false, two_factor_enabled: true, created_at: new Date().toISOString() },
    ];
    mockUseUsers.mockReturnValue({
      data: mockUsersData,
      isLoading: false,
      error: null,
    });

    // Act
    render(<UserTable />);

    // Assert
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();

    // Check for role badges
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('editor')).toBeInTheDocument();

    // Check for status badges
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });
});
