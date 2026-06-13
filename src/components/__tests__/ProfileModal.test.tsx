import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileModal } from '../ProfileModal';
import { ToastProvider } from '../../contexts/ToastContext';

vi.mock('../../lib/supabase', () => {
  const mockInstance = (globalThis as any).createSupabaseMock();
  return {
    supabase: mockInstance.client,
    _mockInstance: mockInstance,
  };
});

import * as supabaseModule from '../../lib/supabase';

const mockSupabaseInstance = (supabaseModule as any)._mockInstance;

describe('ProfileModal Component', () => {
  const userId = 'user-123';
  const currentName = 'Leo Messi';
  const currentAvatarUrl = 'https://example.com/leo.jpg';
  const mockOnClose = vi.fn();
  const mockOnProfileUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders current profile information in inputs', () => {
    render(
      <ToastProvider>
        <ProfileModal
          userId={userId}
          currentName={currentName}
          currentAvatarUrl={currentAvatarUrl}
          onClose={mockOnClose}
          onProfileUpdate={mockOnProfileUpdate}
        />
      </ToastProvider>
    );

    expect(screen.getByLabelText(/nombre/i)).toHaveValue(currentName);
    expect(screen.getByLabelText(/avatar/i)).toHaveValue(currentAvatarUrl);
    expect(screen.getByAltText('Avatar preview')).toHaveAttribute('src', currentAvatarUrl);
  });

  test('submits successfully and calls callbacks', async () => {
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockEq, null);

    render(
      <ToastProvider>
        <ProfileModal
          userId={userId}
          currentName={currentName}
          currentAvatarUrl={currentAvatarUrl}
          onClose={mockOnClose}
          onProfileUpdate={mockOnProfileUpdate}
        />
      </ToastProvider>
    );

    const nameInput = screen.getByLabelText(/nombre/i);
    const formButton = screen.getByRole('button', { name: /guardar/i });

    // Cambiar nombre
    fireEvent.change(nameInput, { target: { value: 'Lionel Messi' } });

    await act(async () => {
      fireEvent.click(formButton);
      await Promise.resolve(); // resolver update query
    });

    expect(mockSupabaseInstance.mockFrom).toHaveBeenCalledWith('users');
    expect(mockSupabaseInstance.mockUpdate).toHaveBeenCalledWith({
      name: 'Lionel Messi',
      avatar_url: currentAvatarUrl,
    });
    expect(mockSupabaseInstance.mockEq).toHaveBeenCalledWith('id', userId);
    
    expect(mockOnProfileUpdate).toHaveBeenCalledWith('Lionel Messi', currentAvatarUrl);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
