import { describe, expect, it } from 'vitest';
import { destinationContent, loadDestinations, sortDestinationsByName } from './destinations';
import { findDestinationSetProblems } from './expectedDestinations';

describe('loadDestinations', () => {
  it('returns the parsed destinations, ordered by name', () => {
    const result = loadDestinations([
      { slug: 'skardu', name: 'Skardu' },
      { slug: 'fairy-meadows', name: 'Fairy Meadows' },
      { slug: 'hunza', name: 'Hunza' },
    ]);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.destinations.map((destination) => destination.name)).toEqual([
        'Fairy Meadows',
        'Hunza',
        'Skardu',
      ]);
    }
  });

  it('reports the problem rather than throwing when the payload is not a list', () => {
    const result = loadDestinations({ destinations: [] });

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.detail).toContain('(root)');
    }
  });

  it('names the destination and the field when a record is incomplete', () => {
    const result = loadDestinations([{ slug: 'hunza' }]);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.detail).toContain('0.name');
    }
  });

  it('reports a key the agreed shape does not name instead of dropping it', () => {
    const result = loadDestinations([{ slug: 'hunza', name: 'Hunza', best_season: 'Summer' }]);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.detail).toContain('best_season');
    }
  });
});

describe('sortDestinationsByName', () => {
  it('sorts a hyphenated name where a reader expects it', () => {
    const sorted = sortDestinationsByName([
      { slug: 'swat', name: 'Swat' },
      { slug: 'mohenjo-daro', name: 'Mohenjo-daro' },
      { slug: 'lahore', name: 'Lahore' },
    ]);

    expect(sorted.map((destination) => destination.name)).toEqual([
      'Lahore',
      'Mohenjo-daro',
      'Swat',
    ]);
  });

  it('leaves the array it was given untouched', () => {
    const given = [
      { slug: 'swat', name: 'Swat' },
      { slug: 'lahore', name: 'Lahore' },
    ];

    sortDestinationsByName(given);

    expect(given.map((destination) => destination.name)).toEqual(['Swat', 'Lahore']);
  });
});

describe('the committed content file', () => {
  it('loads without a schema problem', () => {
    expect(destinationContent.status).toBe('ok');
  });

  it('holds exactly the eight agreed destinations', () => {
    expect(destinationContent.status).toBe('ok');
    if (destinationContent.status === 'ok') {
      expect(findDestinationSetProblems(destinationContent.destinations)).toEqual([]);
    }
  });
});
