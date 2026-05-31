import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ShareLeague } from '../ShareLeague';

describe('ShareLeague Component', () => {
  const inviteCode = 'TEST1234';
  const leagueName = 'Test League';

  beforeEach(() => {
    vi.useFakeTimers();
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.open
    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('copies invite code to clipboard and displays success feedback', async () => {
    render(<ShareLeague inviteCode={inviteCode} leagueName={leagueName} />);

    const copyButton = screen.getByText('Copiar Código');
    expect(copyButton).toBeInTheDocument();

    // Hacemos el click y esperamos a que se procesen las microtareas y la promesa del clipboard
    await act(async () => {
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(inviteCode);

    // Debería cambiar el texto a "¡Copiado!"
    expect(screen.getByText('¡Copiado!')).toBeInTheDocument();

    // Avanzar 2 segundos en fake timers
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Debería volver a "Copiar Código"
    expect(screen.getByText('Copiar Código')).toBeInTheDocument();
  });

  test('calls navigator.share when Web Share API is available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    render(<ShareLeague inviteCode={inviteCode} leagueName={leagueName} />);

    const shareButton = screen.getByText('Compartir Liga');
    fireEvent.click(shareButton);

    expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({
      title: `Liga ${leagueName} - ProdeMundial`,
      text: expect.stringContaining(inviteCode),
      url: window.location.origin,
    }));
  });

  test('falls back to WhatsApp link when Web Share API is not available', () => {
    // navigator.share is undefined
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<ShareLeague inviteCode={inviteCode} leagueName={leagueName} />);

    const shareButton = screen.getByText('Compartir Liga');
    fireEvent.click(shareButton);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://api.whatsapp.com/send?text='),
      '_blank'
    );
  });
});
