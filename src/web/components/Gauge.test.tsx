// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Gauge from './Gauge';

describe('Gauge', () => {
  it('renders the value, verdict, subtitle, and an accessible label', () => {
    render(<Gauge value={72} verdict="Interview-capable" subtitle="Ready to practice hard." />);
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('Interview-capable')).toBeInTheDocument();
    expect(screen.getByText('Ready to practice hard.')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Readiness 72 percent — Interview-capable');
  });
});
