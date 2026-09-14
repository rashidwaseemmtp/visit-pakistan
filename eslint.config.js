import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * The architecture's "all content and all user input rendered as text" control. It has to
 * cover every route into the HTML parser, not just the JSX attribute: a hand-rolled DOM
 * write in a later story would otherwise pass lint silently.
 */
const NO_RAW_HTML =
  'Content must be rendered as text; raw HTML (dangerouslySetInnerHTML, innerHTML, outerHTML, insertAdjacentHTML) is not allowed.';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: NO_RAW_HTML,
        },
        {
          // The same prop reached through a props object, a spread or createElement.
          selector: 'Property[key.name="dangerouslySetInnerHTML"]',
          message: NO_RAW_HTML,
        },
        {
          selector:
            'AssignmentExpression[left.type="MemberExpression"][left.property.name=/^(inner|outer)HTML$/]',
          message: NO_RAW_HTML,
        },
        {
          selector: 'CallExpression[callee.property.name="insertAdjacentHTML"]',
          message: NO_RAW_HTML,
        },
      ],
    },
  },
  { files: ['**/*.d.ts'], rules: { '@typescript-eslint/triple-slash-reference': 'off' } },
);
