import { collator } from './destinations';
import type { Destination } from './schema';

/**
 * Which destination fields the free-text search reads. Configuration, not a constant of
 * the design: whether the client expects search over attractions and travel information
 * as well as the name is an open question, and widening it is this list plus a test.
 */
export const SEARCHABLE_FIELDS: readonly (keyof Destination)[] = ['name'];

/** The two fields the list can be filtered by. Options come from the content, never from here. */
export type FacetField = 'province' | 'category';

export interface DestinationCriteria {
  readonly searchTerm: string;
  readonly province: string;
  readonly category: string;
}

/** Nothing typed, both filters on their unfiltered option. */
export const NO_CRITERIA: DestinationCriteria = { searchTerm: '', province: '', category: '' };

export interface ActiveCriterion {
  readonly label: string;
  readonly value: string;
}

function normalise(value: string): string {
  return value.trim().toLocaleLowerCase('en');
}

function searchableValues(destination: Destination): string[] {
  return SEARCHABLE_FIELDS.flatMap((field) => {
    const value = destination[field];

    if (typeof value === 'string') {
      return [value];
    }

    return Array.isArray(value) ? value : [];
  });
}

/**
 * A literal substring test, never a regular expression: a term containing `.*`, `(` or
 * `<b>` is searched for as the text the visitor typed. Casing and surrounding whitespace
 * are ignored on both sides, so " HUNZA " matches Hunza.
 */
export function matchesSearchTerm(destination: Destination, searchTerm: string): boolean {
  const term = normalise(searchTerm);

  if (term === '') {
    return true;
  }

  return searchableValues(destination).some((value) => normalise(value).includes(term));
}

/** An unselected facet matches everything; a selected one matches the exact stored value. */
export function matchesFacet(destination: Destination, field: FacetField, selected: string): boolean {
  return selected === '' || destination[field] === selected;
}

/** AND semantics: every active criterion has to hold for the destination to be shown. */
export function filterDestinations(
  destinations: readonly Destination[],
  criteria: DestinationCriteria,
): Destination[] {
  return destinations.filter(
    (destination) =>
      matchesSearchTerm(destination, criteria.searchTerm) &&
      matchesFacet(destination, 'province', criteria.province) &&
      matchesFacet(destination, 'category', criteria.category),
  );
}

/**
 * The values a filter offers are exactly the values present in data/destinations.json —
 * de-duplicated, in reading order. A value held by a single destination is still offered.
 */
export function collectFilterOptions(
  destinations: readonly Destination[],
  field: FacetField,
): string[] {
  const values = new Set<string>();

  for (const destination of destinations) {
    const value = destination[field];
    if (typeof value === 'string' && value.length > 0) {
      values.add(value);
    }
  }

  return [...values].sort((a, b) => collator.compare(a, b));
}

/** Is there anything for the clear control to clear? Typed-but-blank counts: the field is not empty. */
export function hasActiveCriteria(criteria: DestinationCriteria): boolean {
  return criteria.searchTerm !== '' || criteria.province !== '' || criteria.category !== '';
}

/** The active criteria, named, for the empty state. Rendered as text, so never interpreted. */
export function describeActiveCriteria(criteria: DestinationCriteria): ActiveCriterion[] {
  const described: ActiveCriterion[] = [];
  const searchTerm = criteria.searchTerm.trim();

  if (searchTerm !== '') {
    described.push({ label: 'Search', value: searchTerm });
  }
  if (criteria.province !== '') {
    described.push({ label: 'Province', value: criteria.province });
  }
  if (criteria.category !== '') {
    described.push({ label: 'Category', value: criteria.category });
  }

  return described;
}

function countDestinations(count: number): string {
  return count === 1 ? '1 destination' : `${count} destinations`;
}

/** The sentence shown on the page and announced through the live region. */
export function formatResultCount(matching: number, total: number): string {
  if (matching === 0) {
    return 'No destinations match your search and filters.';
  }

  if (matching === total) {
    return `Showing all ${countDestinations(total)}.`;
  }

  return `Showing ${countDestinations(matching)} of ${total}.`;
}
