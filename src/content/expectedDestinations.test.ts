import { describe, expect, it } from 'vitest';
import { EXPECTED_DESTINATION_SLUGS, findDestinationSetProblems } from './expectedDestinations';

const completeSet = EXPECTED_DESTINATION_SLUGS.map((slug) => ({ slug }));

describe('findDestinationSetProblems', () => {
  it('reports nothing for exactly the eight expected destinations', () => {
    expect(findDestinationSetProblems(completeSet)).toEqual([]);
  });

  it('reports a content file with fewer destinations', () => {
    const problems = findDestinationSetProblems(completeSet.slice(0, 7));

    expect(problems).toContain('expected 8 destinations, found 7');
    expect(problems).toContain('missing destination(s): mohenjo-daro');
  });

  it('reports a content file with an extra destination', () => {
    const problems = findDestinationSetProblems([...completeSet, { slug: 'atlantis' }]);

    expect(problems).toContain('expected 8 destinations, found 9');
    expect(problems).toContain('unexpected destination(s): atlantis');
  });

  it('reports a substituted destination even when the count matches', () => {
    expect(findDestinationSetProblems([...completeSet.slice(0, 7), { slug: 'atlantis' }])).toEqual([
      'missing destination(s): mohenjo-daro',
      'unexpected destination(s): atlantis',
    ]);
  });
});
