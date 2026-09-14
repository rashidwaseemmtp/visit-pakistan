import { describe, expect, it } from 'vitest';
import { findUnpinnedActions, readWorkflowFiles } from './workflow-pins';

const pinned = [
  'jobs:',
  '  build:',
  '    steps:',
  '      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2',
  '      - run: npm ci',
].join('\n');

describe('findUnpinnedActions', () => {
  it('accepts an action pinned to a full commit SHA with the tag as a comment', () => {
    expect(findUnpinnedActions(pinned)).toEqual([]);
  });

  it('reports an action pinned only to a mutable tag', () => {
    expect(findUnpinnedActions('      - uses: actions/checkout@v4 # pin to the full commit SHA')).toEqual([
      'actions/checkout@v4',
    ]);
  });

  it('reports a branch reference and a quoted reference', () => {
    const workflow = ['      - uses: actions/deploy-pages@main', "      - uses: 'actions/setup-node@v4'"].join('\n');

    expect(findUnpinnedActions(workflow)).toEqual(['actions/deploy-pages@main', 'actions/setup-node@v4']);
  });

  it('ignores an action defined in this repository, which has nothing to pin', () => {
    expect(findUnpinnedActions('      - uses: ./.github/actions/setup')).toEqual([]);
  });
});

describe('the workflows committed to this repository', () => {
  /**
   * Vacuous until a maintainer commits .github/workflows/ci.yml (this change set cannot
   * write under .github/); from that commit onwards it fails the build if the SHA-pinning
   * step in docs/github-pages-deploy.md was skipped.
   */
  it('pin every third-party action to a full commit SHA', () => {
    const unpinned = readWorkflowFiles().map((workflow) => ({
      workflow: workflow.name,
      unpinned: findUnpinnedActions(workflow.contents),
    }));

    expect(unpinned.filter((entry) => entry.unpinned.length > 0)).toEqual([]);
  });
});
