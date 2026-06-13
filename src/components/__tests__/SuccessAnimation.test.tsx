import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuccessAnimation } from '../SuccessAnimation';

describe('SuccessAnimation Component', () => {
  test('renders success checkmark and message', () => {
    render(<SuccessAnimation message="Listo" />);
    
    // Check message
    expect(screen.getByText('Listo')).toBeInTheDocument();
    
    // Check SVG structure exists
    const svgEl = document.querySelector('svg');
    expect(svgEl).toBeInTheDocument();
    
    const pathEl = document.querySelector('path');
    expect(pathEl).toBeInTheDocument();
  });

  test('renders without message when empty', () => {
    render(<SuccessAnimation message="" />);
    
    const textEl = screen.queryByRole('span');
    expect(textEl).toBeNull();
  });
});
