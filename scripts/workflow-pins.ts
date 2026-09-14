import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const workflowsDir = fileURLToPath(new URL('../.github/workflows/', import.meta.url));

/** `uses: owner/action@ref`, with or without quotes and with any trailing comment dropped. */
const usesPattern = /^[^\S\n]*-?[^\S\n]*uses:[^\S\n]*['"]?([^'"\s]+)/gm;

/** A 40-character commit SHA is the only reference that cannot be moved under us. */
const commitShaPattern = /@[0-9a-f]{40}$/;

export interface WorkflowFile {
  readonly name: string;
  readonly contents: string;
}

/**
 * The architecture names a compromised action as the single realistic route to injecting
 * code into the published site, so every third-party `uses:` must name a commit SHA. An
 * action defined in this repository (`./.github/actions/...`) has nothing to pin.
 */
export function findUnpinnedActions(contents: string): string[] {
  return [...contents.matchAll(usesPattern)]
    .map((match) => match[1])
    .filter((reference) => !reference.startsWith('./') && !commitShaPattern.test(reference));
}

/** Empty while the workflow is still a document — see docs/github-pages-deploy.md. */
export function readWorkflowFiles(): WorkflowFile[] {
  let entries: string[];

  try {
    entries = readdirSync(workflowsDir);
  } catch {
    return [];
  }

  return entries
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => ({ name, contents: readFileSync(`${workflowsDir}${name}`, 'utf8') }));
}
