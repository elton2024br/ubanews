import React from 'react';
import { render } from '../utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';

describe('ThemeToggle accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<ThemeToggle />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
