import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppErrorBoundary } from './AppErrorBoundary';

const strings = {
  boundaryTitle: 'Title',
  boundaryMessage: 'Message',
  detailsDevelopmentOnly: 'Dev details',
  tryAgain: 'Try again',
  reloadPage: 'Reload page',
  returnToHomePage: 'Home',
};

describe('AppErrorBoundary', () => {
  it('invokes reset, onReload, and onGoHome when the action buttons are clicked', () => {
    const reset = vi.fn();
    const onReload = vi.fn();
    const onGoHome = vi.fn();

    render(
      <AppErrorBoundary
        error={new Error('unit')}
        reset={reset}
        onReload={onReload}
        onGoHome={onGoHome}
        strings={strings}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: strings.tryAgain }));
    fireEvent.click(screen.getByRole('button', { name: strings.reloadPage }));
    fireEvent.click(screen.getByRole('button', { name: strings.returnToHomePage }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('omits the development details block when NODE_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    render(
      <AppErrorBoundary
        error={new Error('prod')}
        reset={() => {}}
        onReload={() => {}}
        onGoHome={() => {}}
        strings={strings}
      />
    );

    expect(screen.queryByText(strings.detailsDevelopmentOnly)).toBeNull();

    vi.unstubAllEnvs();
  });

  it('shows the development details summary when NODE_ENV is development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    render(
      <AppErrorBoundary
        error={new Error('dev')}
        reset={() => {}}
        onReload={() => {}}
        onGoHome={() => {}}
        strings={strings}
      />
    );

    expect(screen.getByText(strings.detailsDevelopmentOnly)).toBeTruthy();

    vi.unstubAllEnvs();
  });
});
