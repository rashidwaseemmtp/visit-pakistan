import { describe, expect, it } from 'vitest';
import {
  NO_CRITERIA,
  SEARCHABLE_FIELDS,
  collectFilterOptions,
  describeActiveCriteria,
  filterDestinations,
  formatResultCount,
  hasActiveCriteria,
  matchesFacet,
  matchesSearchTerm,
} from './filters';
import type { Destination } from './schema';

/**
 * Fixture records, not content. data/destinations.json carries names only, so the province
 * and category rules are proved here against a set that has those fields; the names below
 * are invented for the test and never reach the page. The behaviour against the client's
 * real content is asserted in src/pages/HomePage.test.tsx and e2e/destination-search.spec.ts.
 */
const destinations: readonly Destination[] = [
  { slug: 'north-valley', name: 'North Valley', province: 'Northern', category: 'Mountains' },
  { slug: 'north-lake', name: 'North Lake', province: 'Northern', category: 'Lakes' },
  { slug: 'east-valley', name: 'East Valley', province: 'Eastern', category: 'Mountains' },
  { slug: 'east-city', name: 'East City', province: 'Eastern', category: 'Cities' },
  { slug: 'south-ruins', name: 'South Ruins', province: 'Southern', category: 'Heritage' },
];

const northValley = destinations[0];

function namesOf(matching: readonly Destination[]): string[] {
  return matching.map((destination) => destination.name);
}

describe('matchesSearchTerm', () => {
  it('matches on part of the destination name', () => {
    expect(matchesSearchTerm(northValley, 'nort')).toBe(true);
    expect(matchesSearchTerm(northValley, 'valley')).toBe(true);
  });

  it('ignores casing and surrounding whitespace', () => {
    expect(matchesSearchTerm(northValley, ' NORTH VALLEY ')).toBe(true);
    expect(matchesSearchTerm(northValley, '\tnorth\n')).toBe(true);
  });

  it('matches everything when the term is empty or only whitespace', () => {
    expect(matchesSearchTerm(northValley, '')).toBe(true);
    expect(matchesSearchTerm(northValley, '   ')).toBe(true);
  });

  it('does not match a term the name does not contain', () => {
    expect(matchesSearchTerm(northValley, 'atlantis')).toBe(false);
  });

  it('treats regex metacharacters as literal text rather than as a pattern', () => {
    expect(matchesSearchTerm(northValley, '.*')).toBe(false);
    expect(matchesSearchTerm(northValley, 'North.*Valley')).toBe(false);
    expect(matchesSearchTerm(northValley, '^North')).toBe(false);
    expect(matchesSearchTerm({ slug: 'upper', name: 'Valley (upper)' }, '(upper)')).toBe(true);
  });

  it('treats HTML characters as literal text', () => {
    expect(matchesSearchTerm(northValley, '<b>North</b>')).toBe(false);
    expect(matchesSearchTerm({ slug: 'tagged', name: 'A <b> place' }, '<b>')).toBe(true);
  });

  it('reads the destination name only, as SEARCHABLE_FIELDS says', () => {
    expect(SEARCHABLE_FIELDS).toEqual(['name']);
    expect(
      matchesSearchTerm(
        { slug: 'north-valley', name: 'North Valley', travelInformation: 'Reached by road' },
        'road',
      ),
    ).toBe(false);
  });

  it('matches a several-hundred-character term against nothing rather than throwing', () => {
    expect(matchesSearchTerm(northValley, 'z'.repeat(500))).toBe(false);
  });
});

describe('matchesFacet', () => {
  it('matches every destination while the facet is on its unfiltered option', () => {
    expect(matchesFacet(northValley, 'province', '')).toBe(true);
    expect(matchesFacet({ slug: 'plain', name: 'Plain' }, 'province', '')).toBe(true);
  });

  it('matches only the exact stored value', () => {
    expect(matchesFacet(northValley, 'province', 'Northern')).toBe(true);
    expect(matchesFacet(northValley, 'province', 'Eastern')).toBe(false);
    expect(matchesFacet(northValley, 'province', 'northern')).toBe(false);
  });

  it('never matches a destination the content file gives no value for', () => {
    expect(matchesFacet({ slug: 'plain', name: 'Plain' }, 'category', 'Mountains')).toBe(false);
  });
});

describe('filterDestinations', () => {
  it('returns every destination, in the given order, when no criterion is active', () => {
    expect(namesOf(filterDestinations(destinations, NO_CRITERIA))).toEqual(namesOf(destinations));
  });

  it('narrows to the destinations matching the search term', () => {
    expect(namesOf(filterDestinations(destinations, { ...NO_CRITERIA, searchTerm: 'valley' }))).toEqual([
      'North Valley',
      'East Valley',
    ]);
  });

  it('narrows to the destinations in the selected province', () => {
    expect(namesOf(filterDestinations(destinations, { ...NO_CRITERIA, province: 'Northern' }))).toEqual([
      'North Valley',
      'North Lake',
    ]);
  });

  it('narrows to the destinations in the selected category', () => {
    expect(namesOf(filterDestinations(destinations, { ...NO_CRITERIA, category: 'Mountains' }))).toEqual([
      'North Valley',
      'East Valley',
    ]);
  });

  it('requires every active criterion to hold at once', () => {
    expect(
      namesOf(
        filterDestinations(destinations, {
          searchTerm: 'valley',
          province: 'Northern',
          category: 'Mountains',
        }),
      ),
    ).toEqual(['North Valley']);
  });

  it('returns nothing when the combination matches no destination', () => {
    expect(
      filterDestinations(destinations, { searchTerm: 'valley', province: 'Southern', category: '' }),
    ).toEqual([]);
  });
});

describe('collectFilterOptions', () => {
  it('offers exactly the values present in the content, de-duplicated and ordered', () => {
    expect(collectFilterOptions(destinations, 'province')).toEqual(['Eastern', 'Northern', 'Southern']);
    expect(collectFilterOptions(destinations, 'category')).toEqual([
      'Cities',
      'Heritage',
      'Lakes',
      'Mountains',
    ]);
  });

  it('still offers a value held by a single destination', () => {
    expect(collectFilterOptions(destinations, 'province')).toContain('Southern');
    expect(collectFilterOptions(destinations, 'category')).toContain('Heritage');
  });

  it('offers nothing for a field the content file carries no values for', () => {
    const nameOnly: readonly Destination[] = [
      { slug: 'one', name: 'One' },
      { slug: 'two', name: 'Two' },
    ];

    expect(collectFilterOptions(nameOnly, 'province')).toEqual([]);
    expect(collectFilterOptions(nameOnly, 'category')).toEqual([]);
  });
});

describe('hasActiveCriteria', () => {
  it('is false when nothing is typed and both filters are unfiltered', () => {
    expect(hasActiveCriteria(NO_CRITERIA)).toBe(false);
  });

  it('is true for a search term, a province or a category on its own', () => {
    expect(hasActiveCriteria({ ...NO_CRITERIA, searchTerm: 'north' })).toBe(true);
    expect(hasActiveCriteria({ ...NO_CRITERIA, province: 'Northern' })).toBe(true);
    expect(hasActiveCriteria({ ...NO_CRITERIA, category: 'Lakes' })).toBe(true);
  });

  it('is true for a whitespace-only term, because the field is not empty', () => {
    expect(hasActiveCriteria({ ...NO_CRITERIA, searchTerm: '  ' })).toBe(true);
  });
});

describe('describeActiveCriteria', () => {
  it('names nothing when no criterion is active', () => {
    expect(describeActiveCriteria(NO_CRITERIA)).toEqual([]);
  });

  it('names the search term, the province and the category', () => {
    expect(
      describeActiveCriteria({ searchTerm: 'north', province: 'Northern', category: 'Lakes' }),
    ).toEqual([
      { label: 'Search', value: 'north' },
      { label: 'Province', value: 'Northern' },
      { label: 'Category', value: 'Lakes' },
    ]);
  });

  it('names the trimmed search term, and leaves out one that is only whitespace', () => {
    expect(describeActiveCriteria({ ...NO_CRITERIA, searchTerm: '  north  ' })).toEqual([
      { label: 'Search', value: 'north' },
    ]);
    expect(describeActiveCriteria({ ...NO_CRITERIA, searchTerm: '   ' })).toEqual([]);
  });

  it('keeps a term containing markup as the text the visitor typed', () => {
    expect(describeActiveCriteria({ ...NO_CRITERIA, searchTerm: '<b>north</b>' })).toEqual([
      { label: 'Search', value: '<b>north</b>' },
    ]);
  });
});

describe('formatResultCount', () => {
  it('states that nothing matches', () => {
    expect(formatResultCount(0, 8)).toBe('No destinations match your search and filters.');
  });

  it('states the total when everything matches', () => {
    expect(formatResultCount(8, 8)).toBe('Showing all 8 destinations.');
  });

  it('states the number of matches against the total', () => {
    expect(formatResultCount(1, 8)).toBe('Showing 1 destination of 8.');
    expect(formatResultCount(3, 8)).toBe('Showing 3 destinations of 8.');
  });
});
