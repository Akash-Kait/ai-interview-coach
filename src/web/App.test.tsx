// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => localStorage.clear());

function barLabels(): string[] {
  const region = screen.getByRole('region', { name: /competency scores/i });
  return within(region).getAllByRole('listitem').map((li) => li.textContent ?? '');
}

describe('App shell', () => {
  it('defaults to the Dashboard and can switch to Settings', async () => {
    render(<App />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('Readiness'));
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByLabelText(/anthropic api key/i)).toBeInTheDocument();
  });

  it('changing the company in Settings re-weights the Dashboard (F1: immediately)', async () => {
    render(<App />);
    expect(barLabels()[0]).toMatch(/Data Structures/); // default company = generalist
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await userEvent.selectOptions(screen.getByLabelText(/target company/i), 'ml-heavy');
    await userEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(barLabels()[0]).toMatch(/ML/);
  });
});
