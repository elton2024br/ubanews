import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { MobileNewsFiltersState } from '../hooks/useMobileNewsFeed';

interface MobileNewsFiltersProps {
  filters: MobileNewsFiltersState;
  categories: string[];
  onChange: (next: MobileNewsFiltersState) => void;
}

export const MobileNewsFilters: React.FC<MobileNewsFiltersProps> = ({
  filters,
  categories,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar..."
        value={filters.searchTerm}
        onChange={(e) => onChange({ ...filters, searchTerm: e.target.value })}
      />
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filters.category === cat ? 'default' : 'outline'}
            onClick={() => onChange({ ...filters, category: cat })}
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileNewsFilters;
