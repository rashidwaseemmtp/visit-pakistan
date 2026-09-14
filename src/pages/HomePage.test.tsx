import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';
import { EXPECTED_DESTINATION_NAMES } from '../content/expectedDestinations';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HomePage', () => {
  it('lists exactly the eight client-supplied destinations and no other entry', () => {
    render(<HomePage />);

    expect(screen.getAllByRole('listitem')).toHaveLength(EXPECTED_DESTINATION_NAMES.length);
    expect(
      new Set(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)),
    ).toEqual(new Set(EXPECTED_DESTINATION_NAMES));
  });

  it('has a single level-one heading', () => {
    render(<HomePage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows a stated error state instead of a blank page when the content cannot be loaded', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<HomePage content={{ status: 'error', detail: '(root): Expected array' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('We can’t show the destinations right now');
    expect(screen.queryByText(/\(root\): Expected array/)).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
