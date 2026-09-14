import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentErrorState } from './ContentErrorState';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContentErrorState', () => {
  it('states the problem in an alert', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ContentErrorState detail="0.name: Required" />);

    expect(screen.getByRole('alert')).toHaveTextContent('We can’t show the destinations right now');
  });

  it('never renders the schema detail to the visitor', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ContentErrorState detail="0.name: Required" />);

    expect(screen.queryByText(/0\.name: Required/)).not.toBeInTheDocument();
  });

  it('logs the detail so a developer can still diagnose it', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ContentErrorState detail="0.name: Required" />);

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('0.name: Required'));
  });

  it('logs nothing when there is no detail', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ContentErrorState />);

    expect(consoleError).not.toHaveBeenCalled();
  });
});
