import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ErrorBoundary from '../components/common/ErrorBoundary';

function ExplodingChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Boom during render');
  }
  return <div data-testid="healthy-child">All good</div>;
}

describe('ErrorBoundary', () => {
  it('renders children normally when no error is thrown', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ExplodingChild shouldThrow={false} />
        </ErrorBoundary>
      </MemoryRouter>
    );
    expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
  });

  it('catches render errors and recovers on Try again', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReset = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <ErrorBoundary onReset={onReset}>
          <ExplodingChild shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Boom during render')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ErrorBoundary onReset={onReset}>
          <ExplodingChild shouldThrow={false} />
        </ErrorBoundary>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
