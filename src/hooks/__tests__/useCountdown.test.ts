import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../useCountdown';

describe('useCountdown Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fijar la fecha actual a las 12:00:00 del 31 de mayo de 2026
    vi.setSystemTime(new Date('2026-05-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns correct calculations for a future date', () => {
    // 2 días, 3 horas, 4 minutos, 5 segundos en el futuro
    const targetDate = new Date('2026-06-02T15:04:05Z').toISOString();
    
    const { result } = renderHook(() => useCountdown(targetDate));

    expect(result.current.days).toBe(2);
    expect(result.current.hours).toBe(3);
    expect(result.current.minutes).toBe(4);
    expect(result.current.seconds).toBe(5);
    expect(result.current.isExpired).toBe(false);
  });

  test('returns isExpired true for past dates', () => {
    // 1 hora en el pasado
    const targetDate = new Date('2026-05-31T11:00:00Z').toISOString();

    const { result } = renderHook(() => useCountdown(targetDate));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  test('updates values over time', () => {
    const targetDate = new Date('2026-05-31T12:00:05Z').toISOString();

    const { result } = renderHook(() => useCountdown(targetDate));

    expect(result.current.seconds).toBe(5);
    expect(result.current.isExpired).toBe(false);

    // Avanzar 2 segundos
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.seconds).toBe(3);
    expect(result.current.isExpired).toBe(false);

    // Avanzar otros 4 segundos (para expirar)
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });
});
