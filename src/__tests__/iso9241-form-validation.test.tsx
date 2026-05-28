/**
 * ISO 9241-110 conformance — AddListing form.
 *
 * Principles exercised:
 *   - Fehlertoleranz (error tolerance): every required field is validated, each
 *     error is shown inline with role="alert", numeric ranges are guarded, and
 *     errors clear as the user corrects the field.
 *   - Selbstbeschreibungsfähigkeit (self-descriptiveness): error messages are
 *     specific and actionable; inputs expose aria-invalid.
 *   - ISO 9241-171 (accessibility): the icon-only back button has an accessible name.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => {
  const toast = Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() });
  return { toast };
});

import AddListing from '../app/pages/AddListing';
import { toast } from 'sonner';

function renderPage() {
  return render(
    <MemoryRouter>
      <AddListing />
    </MemoryRouter>
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Frische Brötchen' } });
  fireEvent.change(screen.getByLabelText(/Beschreibung/), { target: { value: 'Vom Vortag, noch gut' } });
  fireEvent.change(screen.getByLabelText(/Standort/), { target: { value: 'Brückenstraße 4, Berlin' } });
  fireEvent.change(screen.getByLabelText(/Verfügbar für/), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText(/Kontakt/), { target: { value: '030 1234567' } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Veröffentlichen' }));
}

describe('ISO 9241 Fehlertoleranz — required field validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an inline alert for every empty required field on submit', () => {
    renderPage();
    submit();
    // title, description, location, expiresIn, contact → 5 required fields
    expect(screen.getAllByRole('alert')).toHaveLength(5);
  });

  it('does not submit (no success toast) when validation fails', () => {
    renderPage();
    submit();
    expect(toast.error).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('marks invalid inputs with aria-invalid', () => {
    renderPage();
    submit();
    expect(screen.getByLabelText(/Titel/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Kontakt/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects an expiry of 0 hours with a specific message', () => {
    renderPage();
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/Verfügbar für/), { target: { value: '0' } });
    submit();
    expect(screen.getByText(/größer als 0/i)).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('rejects a negative price', () => {
    renderPage();
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/Preis/), { target: { value: '-5' } });
    submit();
    expect(screen.getByText(/nicht negativ/i)).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('accepts a fully valid form and confirms with a success toast', () => {
    renderPage();
    fillValidForm();
    submit();
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    expect(toast.success).toHaveBeenCalled();
  });

  it('clears a field error as soon as the user corrects it', () => {
    renderPage();
    submit();
    expect(screen.getAllByRole('alert')).toHaveLength(5);

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Brot' } });
    // One error resolved → 4 remain
    expect(screen.getAllByRole('alert')).toHaveLength(4);
  });
});

describe('ISO 9241-171 accessibility — AddListing controls have accessible names', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('the icon-only back button exposes an accessible name', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: 'Zurück zur Übersicht' })
    ).toBeInTheDocument();
  });
});
