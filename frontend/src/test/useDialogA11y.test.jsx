import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useDialogA11y from '../hooks/useDialogA11y';

function TestModal({ isOpen, onClose }) {
  const modalRef = useDialogA11y(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div data-testid="modal-backdrop">
      <div ref={modalRef} role="dialog" aria-modal="true" data-testid="modal-container">
        <input data-testid="input-first" placeholder="First input" />
        <button data-testid="btn-action">Perform Action</button>
        <button data-testid="btn-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function TestApp() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button data-testid="btn-open" onClick={() => setOpen(true)}>
        Open Modal
      </button>
      <TestModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
}

describe('useDialogA11y Hook', () => {
  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<TestModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus inside the dialog when Tab is pressed on last item', () => {
    render(<TestModal isOpen={true} onClose={vi.fn()} />);

    const first = screen.getByTestId('input-first');
    const last = screen.getByTestId('btn-cancel');

    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: 'Tab', code: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(first);
  });

  it('cycles focus in reverse when Shift + Tab is pressed on first item', () => {
    render(<TestModal isOpen={true} onClose={vi.fn()} />);

    const first = screen.getByTestId('input-first');
    const last = screen.getByTestId('btn-cancel');

    first.focus();
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: 'Tab', code: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('restores focus to trigger button after modal is closed', () => {
    render(<TestApp />);

    const openBtn = screen.getByTestId('btn-open');
    openBtn.focus();
    expect(document.activeElement).toBe(openBtn);

    fireEvent.click(openBtn);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByTestId('modal-container')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(openBtn);
  });
});

