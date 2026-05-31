import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Skeleton, MatchCardSkeleton, StandingRowSkeleton } from '../Skeleton';

describe('Skeleton Components', () => {
  test('renders base Skeleton with correct default classes', () => {
    render(<Skeleton />);
    const el = screen.getByTestId('skeleton-element');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('animate-pulse');
    expect(el).toHaveClass('rounded-xl');
  });

  test('applies variant classes and custom dimensions', () => {
    render(<Skeleton variant="circular" width={50} height={50} />);
    const el = screen.getByTestId('skeleton-element');
    expect(el).toHaveClass('rounded-full');
    expect(el).toHaveStyle({ width: '50px', height: '50px' });
  });

  test('renders MatchCardSkeleton and elements', () => {
    render(<MatchCardSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton-element');
    // Debe tener múltiples esqueletos internos
    expect(skeletons.length).toBeGreaterThan(5);
  });

  test('renders StandingRowSkeleton and elements', () => {
    render(<StandingRowSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton-element');
    // Debe tener múltiples esqueletos internos (pos, avatar, name, email, points)
    expect(skeletons.length).toBeGreaterThan(3);
  });
});
