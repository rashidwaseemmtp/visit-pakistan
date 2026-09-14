import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The architecture's "all content and all user input rendered as text" control lives in
 * eslint.config.js, so it is tested by running the repository's own flat config over a
 * snippet rather than by a unit test of a module.
 */
const RAW_HTML_MESSAGE = 'Content must be rendered as text';

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint();
});

async function lint(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: 'src/raw-html-fixture.tsx' });
  return result.messages.map((message) => message.message);
}

const bannedForms: ReadonlyArray<readonly [string, string]> = [
  [
    'a dangerouslySetInnerHTML JSX attribute',
    'export function Card({ html }: { html: string }) {\n  return <div dangerouslySetInnerHTML={{ __html: html }} />;\n}\n',
  ],
  [
    'dangerouslySetInnerHTML passed through a props object',
    'export const cardProps = { dangerouslySetInnerHTML: { __html: "<b>x</b>" } };\n',
  ],
  [
    'an innerHTML assignment',
    'export function write(node: HTMLElement, html: string) {\n  node.innerHTML = html;\n}\n',
  ],
  [
    'an outerHTML assignment',
    'export function write(node: HTMLElement, html: string) {\n  node.outerHTML = html;\n}\n',
  ],
  [
    'an insertAdjacentHTML call',
    'export function write(node: HTMLElement, html: string) {\n  node.insertAdjacentHTML("beforeend", html);\n}\n',
  ],
];

describe('the raw-HTML lint ban', () => {
  for (const [description, code] of bannedForms) {
    it(
      `rejects ${description}`,
      async () => {
        const messages = await lint(code);

        expect(messages.some((message) => message.includes(RAW_HTML_MESSAGE))).toBe(true);
      },
      30_000,
    );
  }

  it(
    'allows content written as text',
    async () => {
      const messages = await lint(
        'export function write(node: HTMLElement, text: string) {\n  node.textContent = text;\n}\n',
      );

      expect(messages.filter((message) => message.includes(RAW_HTML_MESSAGE))).toEqual([]);
    },
    30_000,
  );
});
