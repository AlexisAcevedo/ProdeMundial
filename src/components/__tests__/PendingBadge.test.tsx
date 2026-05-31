import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PendingBadge } from '../PendingBadge';

describe('PendingBadge Component', () => {
  test('does not render when count is 0', () => {
    const { container } = render(<PendingBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders count number when count is greater than 0', () => {
    render(<PendingBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('contains animation ping element', () => {
    const { container } = render(<PendingBadge count={3} />);
    const pingElement = container.querySelector('.animate-ping');
    expect(pingElement).toBeInTheDocument();
    expect(pingElement).toHaveClass('bg-amber-400');
  });
});
