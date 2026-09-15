import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';
import { EXPECTED_DESTINATION_NAMES } from '../content/expectedDestinations';

afterEach(() => {
  vi.restoreAllMocks();
});

function listedNames(): string[] {
  const list = screen.queryByRole('list', { name: 'Destinations' });

  return list === null
    ? []
    : within(list)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent ?? '');
}

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

  it('shows only Hunza, and states the number of matches, when the visitor types “hun”', () => {
    render(<HomePage />);

    fireEvent.change(screen.getByLabelText('Search destinations'), { target: { value: 'hun' } });

    expect(listedNames()).toEqual(['Hunza']);
    expect(screen.getByRole('status')).toHaveTextContent(
      `Showing 1 destination of ${EXPECTED_DESTINATION_NAMES.length}.`,
    );
  });

  it('matches Hunza whatever the casing and surrounding whitespace of the term', () => {
    render(<HomePage />);

    fireEvent.change(screen.getByLabelText('Search destinations'), { target: { value: ' HUNZA ' } });

    expect(listedNames()).toEqual(['Hunza']);
  });

  it('names the search term in the empty state and restores all eight when it is cleared', () => {
    render(<HomePage />);

    fireEvent.change(screen.getByLabelText('Search destinations'), { target: { value: 'atlantis' } });

    expect(listedNames()).toEqual([]);
    expect(
      within(screen.getByRole('list', { name: 'Active search and filter criteria' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Search atlantis']);

    fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));

    expect(listedNames()).toHaveLength(EXPECTED_DESTINATION_NAMES.length);
    expect(screen.getByLabelText('Search destinations')).toHaveValue('');
  });
});
