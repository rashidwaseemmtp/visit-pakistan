import type { Destination } from './schema';

/** The eight destinations the client asked for, in the order the story names them. */
export const EXPECTED_DESTINATION_NAMES = [
  'Hunza',
  'Skardu',
  'Fairy Meadows',
  'Swat',
  'Lahore',
  'Islamabad',
  'Karachi',
  'Mohenjo-daro',
] as const;

export const EXPECTED_DESTINATION_SLUGS = [
  'hunza',
  'skardu',
  'fairy-meadows',
  'swat',
  'lahore',
  'islamabad',
  'karachi',
  'mohenjo-daro',
] as const;

/** One message per mismatch with the agreed set; empty when the file is exactly the eight. */
export function findDestinationSetProblems(destinations: readonly Pick<Destination, 'slug'>[]): string[] {
  const problems: string[] = [];
  const actual = destinations.map((destination) => destination.slug);
  const actualSet = new Set(actual);
  const expectedSet = new Set<string>(EXPECTED_DESTINATION_SLUGS);

  if (actual.length !== EXPECTED_DESTINATION_SLUGS.length) {
    problems.push(`expected ${EXPECTED_DESTINATION_SLUGS.length} destinations, found ${actual.length}`);
  }

  const missing = [...expectedSet].filter((slug) => !actualSet.has(slug));
  if (missing.length > 0) {
    problems.push(`missing destination(s): ${missing.join(', ')}`);
  }

  const unexpected = [...actualSet].filter((slug) => !expectedSet.has(slug));
  if (unexpected.length > 0) {
    problems.push(`unexpected destination(s): ${unexpected.join(', ')}`);
  }

  return problems;
}
