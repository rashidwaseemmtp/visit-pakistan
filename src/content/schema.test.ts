import { describe, expect, it } from 'vitest';
import { destinationSchema, destinationsSchema, formatContentIssues } from './schema';

describe('destinationSchema', () => {
  it('keeps supplied values character-for-character', () => {
    const record = {
      slug: 'example-place',
      name: 'Example Place',
      province: 'Example Province',
      category: 'Mountains & Lakes — Ḥigh',
      bestSeason: 'Example season',
    };

    expect(destinationSchema.parse(record)).toEqual(record);
  });

  it('accepts a record that omits every optional field', () => {
    const parsed = destinationSchema.parse({ slug: 'example', name: 'Example' });

    expect(parsed).toEqual({ slug: 'example', name: 'Example' });
    expect(parsed.province).toBeUndefined();
  });

  it('strips keys that are not part of the agreed shape', () => {
    expect(destinationSchema.parse({ slug: 'example', name: 'Example', rating: 5 })).toEqual({
      slug: 'example',
      name: 'Example',
    });
  });

  it('accepts a hyphenated slug', () => {
    expect(destinationSchema.parse({ slug: 'mohenjo-daro', name: 'Mohenjo-daro' }).slug).toBe('mohenjo-daro');
  });

  it('rejects a slug that is not lower-case and hyphen-separated', () => {
    expect(destinationSchema.safeParse({ slug: 'Mohenjo Daro', name: 'Mohenjo-daro' }).success).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(destinationSchema.safeParse({ slug: 'example', name: '' }).success).toBe(false);
  });
});

describe('destinationsSchema', () => {
  it('rejects a payload that is not an array', () => {
    expect(destinationsSchema.safeParse({ destinations: [] }).success).toBe(false);
  });

  it('rejects duplicate slugs', () => {
    const result = destinationsSchema.safeParse([
      { slug: 'example', name: 'One' },
      { slug: 'example', name: 'Two' },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatContentIssues(result.error)).toContain('duplicate slug "example"');
    }
  });

  it('names the path of every issue', () => {
    const result = destinationsSchema.safeParse([{ slug: 'example' }]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatContentIssues(result.error)).toContain('0.name');
    }
  });
});
