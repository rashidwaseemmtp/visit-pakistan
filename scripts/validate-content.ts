import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { destinationsSchema, formatContentIssues } from '../src/content/schema';
import { findDestinationSetProblems } from '../src/content/expectedDestinations';

const contentPath = fileURLToPath(new URL('../data/destinations.json', import.meta.url));

class ContentError extends Error {}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readContent(): unknown {
  let text: string;

  try {
    text = readFileSync(contentPath, 'utf8');
  } catch (error) {
    throw new ContentError(`the file could not be read (${messageOf(error)})`);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ContentError(`the file is not valid JSON (${messageOf(error)})`);
  }
}

function main(): void {
  const parsed = destinationsSchema.safeParse(readContent());

  if (!parsed.success) {
    throw new ContentError(formatContentIssues(parsed.error));
  }

  const problems = findDestinationSetProblems(parsed.data);
  if (problems.length > 0) {
    throw new ContentError(problems.join('\n  '));
  }

  console.log(`Content check passed: ${parsed.data.length} destinations in data/destinations.json.`);
}

try {
  main();
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`Content check failed for data/destinations.json:\n  ${error.message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
