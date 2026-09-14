import rawDestinations from '../../data/destinations.json';
import { destinationsSchema, formatContentIssues, type Destination } from './schema';

export type DestinationContent =
  | { readonly status: 'ok'; readonly destinations: readonly Destination[] }
  | { readonly status: 'error'; readonly detail: string };

/** Locale-aware so a hyphen (Mohenjo-daro) or a non-ASCII letter sorts where a reader expects it. */
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

export function sortDestinationsByName(destinations: readonly Destination[]): Destination[] {
  return [...destinations].sort((a, b) => collator.compare(a.name, b.name));
}

export function loadDestinations(raw: unknown): DestinationContent {
  const parsed = destinationsSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: 'error', detail: formatContentIssues(parsed.error) };
  }

  return { status: 'ok', destinations: sortDestinationsByName(parsed.data) };
}

export const destinationContent: DestinationContent = loadDestinations(rawDestinations);
