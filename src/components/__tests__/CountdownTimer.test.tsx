import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownTimer } from '../CountdownTimer';

describe('CountdownTimer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders Cerrado when expired', () => {
    const pastDate = new Date('2026-05-31T11:59:59Z').toISOString();
    render(<CountdownTimer targetDate={pastDate} />);
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
  });

  test('renders compact format for more than 1 day remaining', () => {
    // 2 días y 5 horas en el futuro
    const futureDate = new Date('2026-06-02T17:00:00Z').toISOString();
    render(<CountdownTimer targetDate={futureDate} />);
    
    // 2d 5h 0m
    expect(screen.getByText('2d 5h 0m')).toBeInTheDocument();
  });

  test('renders remaining time with seconds for less than 1 day remaining', () => {
    // 5 horas en el futuro
    const futureDate = new Date('2026-05-31T17:00:00Z').toISOString();
    render(<CountdownTimer targetDate={futureDate} />);
    
    // 5h 0m 0s
    expect(screen.getByText('5h 0m 0s')).toBeInTheDocument();
  });

  test('applies warning color for less than 2 hours remaining', () => {
    // 1 hora en el futuro
    const warningDate = new Date('2026-05-31T13:00:00Z').toISOString();
    const { container } = render(<CountdownTimer targetDate={warningDate} />);
    
    const element = container.querySelector('.bg-amber-50');
    expect(element).toBeInTheDocument();
  });

  test('applies urgent color and animate-pulse for less than 30 minutes remaining', () => {
    // 15 minutos en el futuro
    const urgentDate = new Date('2026-05-31T12:15:00Z').toISOString();
    const { container } = render(<CountdownTimer targetDate={urgentDate} />);
    
    const element = container.querySelector('.bg-red-50');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('animate-pulse');
  });
});
