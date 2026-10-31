import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApplyForm } from './ApplyForm';
import { ToastProvider } from './ToastProvider';

const renderForm = (hasApplied: boolean) =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <ApplyForm propertyId="0123456789abcdef01234567" hasApplied={hasApplied} onSubmitted={vi.fn()} />
      </ToastProvider>
    </MemoryRouter>
  );

describe('ApplyForm', () => {
  it('opens the intake form from the apply button', async () => {
    const browser = userEvent.setup();
    renderForm(false);

    await browser.click(screen.getByRole('button', { name: /apply for residency/i }));

    expect(screen.getByLabelText(/why this unit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/requested move-in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /file application/i })).toBeInTheDocument();
  });

  it('shows the confirmation state when an application is already on file', () => {
    renderForm(true);

    expect(screen.getByText(/application on file/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /track its status/i })).toHaveAttribute(
      'href',
      '/applications'
    );
    expect(screen.queryByRole('button', { name: /apply for residency/i })).not.toBeInTheDocument();
  });
});
