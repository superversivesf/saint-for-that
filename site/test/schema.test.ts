import { describe, it, expect } from 'vitest';
import { saintSchema } from '../src/lib/schema';

const valid = {
  slug: 'anthony-of-padua',
  name: 'St. Anthony of Padua',
  feastDay: '06-13',
  canonized: '1232',
  bio: 'Anthony of Padua was a Portuguese Catholic priest and friar of the Franciscan Order. He was known for his powerful preaching and expert knowledge of scripture.',
  patronages: [{ need: 'lost items', category: 'everyday' }],
  prayer: {
    text: 'O Holy St. Anthony, gentlest of saints, your love for God and charity for his creatures made you worthy, when on earth, to possess miraculous powers.',
    source: 'traditional',
  },
  image: {
    url: 'https://example.com/anthony.jpg',
    attribution: 'Public domain',
    altText: 'St. Anthony of Padua',
  },
  sources: ['https://en.wikipedia.org/wiki/Anthony_of_Padua'],
};

describe('saintSchema', () => {
  it('accepts a valid saint', () => {
    expect(saintSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad slug', () => {
    expect(saintSchema.safeParse({ ...valid, slug: 'Bad Slug!' }).success).toBe(false);
  });

  it('rejects bad feastDay', () => {
    expect(saintSchema.safeParse({ ...valid, feastDay: '13-01' }).success).toBe(false);
  });

  it('accepts unknown feastDay', () => {
    expect(saintSchema.safeParse({ ...valid, feastDay: 'unknown' }).success).toBe(true);
  });

  it('rejects empty patronages', () => {
    expect(saintSchema.safeParse({ ...valid, patronages: [] }).success).toBe(false);
  });

  it('rejects need with uppercase', () => {
    expect(saintSchema.safeParse({ ...valid, patronages: [{ need: 'Lost Items', category: 'everyday' }] }).success).toBe(false);
  });

  it('rejects need with 5+ words', () => {
    expect(saintSchema.safeParse({ ...valid, patronages: [{ need: 'help for people who are lost', category: 'everyday' }] }).success).toBe(false);
  });

  it('rejects unknown category', () => {
    expect(saintSchema.safeParse({ ...valid, patronages: [{ need: 'lost items', category: 'not-a-category' }] }).success).toBe(false);
  });

  it('rejects non-url source', () => {
    expect(saintSchema.safeParse({ ...valid, sources: ['not-a-url'] }).success).toBe(false);
  });

  it('rejects short bio', () => {
    expect(saintSchema.safeParse({ ...valid, bio: 'too short' }).success).toBe(false);
  });

  it('accepts missing optional fields', () => {
    const { image, prayer, canonized, sources, ...rest } = valid;
    expect(saintSchema.safeParse(rest).success).toBe(true);
  });

  it('accepts draft saint with no sources', () => {
    const { sources, ...rest } = valid;
    expect(saintSchema.safeParse({ ...rest, draft: true }).success).toBe(true);
  });

  it('accepts prayer object', () => {
    expect(saintSchema.safeParse({ ...valid, prayer: { text: 'O God, hear us. Amen.', source: 'original' } }).success).toBe(true);
  });

  it('rejects string prayer', () => {
    expect(saintSchema.safeParse({ ...valid, prayer: 'O God, hear us. Amen.' }).success).toBe(false);
  });

  it('rejects bad prayer source', () => {
    expect(saintSchema.safeParse({ ...valid, prayer: { text: 'O God, hear us. Amen.', source: 'made-up' } }).success).toBe(false);
  });
});
