import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DestinationFinder } from './DestinationFinder';
import type { Destination } from '../content/schema';

/**
 * Fixture records, not content: data/destinations.json carries names only, so the province
 * and category controls are exercised here against a set that has those fields. The names
 * are invented for the test and never reach the page — the behaviour against the client's
 * real content is asserted in src/pages/HomePage.test.tsx and e2e/destination-search.spec.ts.
 */
const destinations: readonly Destination[] = [
  { slug: 'north-valley', name: 'North Valley', province: 'Northern', category: 'Mountains' },
  { slug: 'north-lake', name: 'North Lake', province: 'Northern', category: 'Lakes' },
  { slug: 'east-valley', name: 'East Valley', province: 'Eastern', category: 'Mountains' },
  { slug: 'east-city', name: 'East City', province: 'Eastern', category: 'Cities' },
  { slug: 'south-ruins', name: 'South Ruins', province: 'Southern', category: 'Heritage' },
];

function renderFinder(content: readonly Destination[] = destinations) {
  return render(<DestinationFinder destinations={content} />);
}

function searchField(): HTMLElement {
  return screen.getByLabelText('Search destinations');
}

function provinceFilter(): HTMLElement {
  return screen.getByLabelText('Province');
}

function categoryFilter(): HTMLElement {
  return screen.getByLabelText('Category');
}

function search(term: string) {
  fireEvent.change(searchField(), { target: { value: term } });
}

function select(control: HTMLElement, value: string) {
  fireEvent.change(control, { target: { value } });
}

function clear() {
  fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));
}

/** The destinations currently listed, in the order they are rendered. */
function shownNames(): string[] {
  const list = screen.queryByRole('list', { name: 'Destinations' });

  return list === null
    ? []
    : within(list)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent ?? '');
}

/** The criteria the empty state names, as a screen reader would read them. */
function namedCriteria(): string[] {
  const list = screen.queryByRole('list', { name: 'Active search and filter criteria' });

  return list === null
    ? []
    : within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent ?? '');
}

function optionsOf(control: HTMLElement): string[] {
  return within(control)
    .getAllByRole('option')
    .map((option) => option.textContent ?? '');
}

describe('DestinationFinder', () => {
  it('shows every destination and states the total before anything is entered', () => {
    renderFinder();

    expect(shownNames()).toEqual([
      'North Valley',
      'North Lake',
      'East Valley',
      'East City',
      'South Ruins',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('Showing all 5 destinations.');
  });

  it('narrows the list to the destinations whose name contains the term, and states the count', () => {
    renderFinder();

    search('valley');

    expect(shownNames()).toEqual(['North Valley', 'East Valley']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 destinations of 5.');
  });

  it('ignores casing and surrounding whitespace in the search term', () => {
    renderFinder();

    search(' NORTH LAKE ');

    expect(shownNames()).toEqual(['North Lake']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 destination of 5.');
  });

  it('treats regex characters in the search term as literal text', () => {
    renderFinder();

    search('.*');

    expect(shownNames()).toEqual([]);
    expect(screen.getByRole('heading', { level: 2, name: 'No destinations match' })).toBeInTheDocument();
  });

  it('renders an HTML-like search term as text rather than as markup', () => {
    const { container } = renderFinder();

    search('<b>North</b>');

    expect(container.querySelector('b')).toBeNull();
    expect(namedCriteria()).toEqual(['Search <b>North</b>']);
  });

  it('offers only the province values present in the content, including one held by a single destination', () => {
    renderFinder();

    expect(optionsOf(provinceFilter())).toEqual(['All provinces', 'Eastern', 'Northern', 'Southern']);
  });

  it('shows only the destinations whose province is the selected one', () => {
    renderFinder();

    select(provinceFilter(), 'Northern');

    expect(shownNames()).toEqual(['North Valley', 'North Lake']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 destinations of 5.');
  });

  it('offers only the category values present in the content, including one held by a single destination', () => {
    renderFinder();

    expect(optionsOf(categoryFilter())).toEqual([
      'All categories',
      'Cities',
      'Heritage',
      'Lakes',
      'Mountains',
    ]);
  });

  it('shows only the destinations whose category is the selected one', () => {
    renderFinder();

    select(categoryFilter(), 'Mountains');

    expect(shownNames()).toEqual(['North Valley', 'East Valley']);
  });

  it('combines the search term and both filters, showing only what satisfies all three', () => {
    renderFinder();

    search('valley');
    select(provinceFilter(), 'Northern');
    select(categoryFilter(), 'Mountains');

    expect(shownNames()).toEqual(['North Valley']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 destination of 5.');
  });

  it('leaves out a destination the content file gives no value for the filtered field', () => {
    renderFinder([...destinations, { slug: 'unplaced', name: 'Unplaced Site' }]);

    select(provinceFilter(), 'Northern');

    expect(shownNames()).toEqual(['North Valley', 'North Lake']);
  });

  it('names every active criterion when nothing matches', () => {
    renderFinder();

    search('valley');
    select(provinceFilter(), 'Southern');

    expect(shownNames()).toEqual([]);
    expect(screen.getByRole('heading', { level: 2, name: 'No destinations match' })).toBeInTheDocument();
    expect(namedCriteria()).toEqual(['Search valley', 'Province Southern']);
    expect(screen.getByRole('status')).toHaveTextContent('No destinations match your search and filters.');
  });

  it('restores every destination and empties every control when the criteria are cleared', () => {
    renderFinder();

    search('north');
    select(provinceFilter(), 'Northern');
    select(categoryFilter(), 'Lakes');
    expect(shownNames()).toEqual(['North Lake']);

    clear();

    expect(shownNames()).toHaveLength(destinations.length);
    expect(searchField()).toHaveValue('');
    expect(provinceFilter()).toHaveValue('');
    expect(categoryFilter()).toHaveValue('');
  });

  it('clears from the empty state too, and moves focus to the search field', () => {
    renderFinder();

    search('atlantis');
    expect(shownNames()).toEqual([]);

    clear();

    expect(shownNames()).toHaveLength(destinations.length);
    expect(searchField()).toHaveFocus();
  });

  it('announces the new result count through a live region', () => {
    renderFinder();
    const liveRegion = screen.getByRole('status');

    expect(liveRegion).toHaveTextContent('Showing all 5 destinations.');

    search('valley');

    expect(liveRegion).toHaveTextContent('Showing 2 destinations of 5.');
  });

  it('gives every control a programmatically associated label', () => {
    renderFinder();

    expect(searchField()).toHaveAttribute('id', 'destination-search');
    expect(provinceFilter()).toHaveAttribute('id', 'destination-province');
    expect(categoryFilter()).toHaveAttribute('id', 'destination-category');
  });

  it('keeps a several-hundred-character search term, naming it in the empty state', () => {
    renderFinder();
    const term = 'z'.repeat(500);

    search(term);

    expect(searchField()).toHaveValue(term);
    expect(namedCriteria()).toEqual([`Search ${term}`]);
  });

  it('leaves out a filter the content file carries no values for', () => {
    renderFinder([
      { slug: 'one', name: 'One' },
      { slug: 'two', name: 'Two' },
    ]);

    expect(searchField()).toBeInTheDocument();
    expect(screen.queryByLabelText('Province')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
  });

  it('states the content-level empty case when there is nothing to search at all', () => {
    renderFinder([]);

    expect(screen.queryByLabelText('Search destinations')).not.toBeInTheDocument();
    expect(screen.getByText('There are no destinations to show at the moment.')).toBeInTheDocument();
  });
});
