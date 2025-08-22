import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileNewsFilters } from '../../components/MobileNewsFilters';

const filters = { category: 'Todas', searchTerm: '', sortBy: 'Mais recentes' };

describe('MobileNewsFilters', () => {
  it('calls onChange when category button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <MobileNewsFilters
        filters={filters}
        categories={['Todas', 'Cultura']}
        onChange={handleChange}
      />
    );
    fireEvent.click(screen.getByText('Cultura'));
    expect(handleChange).toHaveBeenCalledWith({
      ...filters,
      category: 'Cultura',
    });
  });
});
