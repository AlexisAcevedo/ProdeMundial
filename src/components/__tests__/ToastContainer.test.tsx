import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../../contexts/ToastContext';
import { ToastContainer } from '../ToastContainer';

// Dummy component to trigger useToast
const TriggerComponent = ({ message, type = 'info', duration }: { message: string; type?: any; duration?: number }) => {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast(message, type, duration)}>
      Add Toast
    </button>
  );
};

describe('ToastContainer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('adds and renders toast correctly with type styling', async () => {
    render(
      <ToastProvider>
        <TriggerComponent message="Hello Success" type="success" />
        <ToastContainer />
      </ToastProvider>
    );

    const button = screen.getByText('Add Toast');
    fireEvent.click(button);

    // Debe mostrarse el toast
    expect(screen.getByText('Hello Success')).toBeInTheDocument();

    // Debe cerrarse automáticamente después de 4s (por defecto)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(screen.queryByText('Hello Success')).not.toBeInTheDocument();
  });

  test('allows manual dismissal by clicking close button', async () => {
    render(
      <ToastProvider>
        <TriggerComponent message="Dismiss Me" type="info" />
        <ToastContainer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    expect(screen.getByText('Dismiss Me')).toBeInTheDocument();

    // Obtener botón de cerrar
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find(btn => btn !== screen.getByText('Add Toast'));
    
    expect(closeBtn).toBeDefined();
    
    await act(async () => {
      fireEvent.click(closeBtn!);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.queryByText('Dismiss Me')).not.toBeInTheDocument();
  });

  test('stacks up to maximum of 3 toasts', async () => {
    render(
      <ToastProvider>
        <TriggerComponent message="Toast" type="info" />
        <ToastContainer />
      </ToastProvider>
    );

    const button = screen.getByText('Add Toast');
    
    // Agregar 4 toasts
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    const renderedToasts = screen.getAllByRole('alert');
    expect(renderedToasts).toHaveLength(3);
  });
});
