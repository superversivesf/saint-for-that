import { describe, it, expect } from 'vitest';
import { NEED_SYNONYMS } from '../src/lib/taxonomy';

describe('NEED_SYNONYMS', () => {
  it('has no empty arrays', () => {
    for (const [need, syns] of Object.entries(NEED_SYNONYMS)) {
      expect(syns.length, `${need} has no synonyms`).toBeGreaterThanOrEqual(5);
    }
  });

  it('has no duplicate synonyms within a need', () => {
    for (const [need, syns] of Object.entries(NEED_SYNONYMS)) {
      expect(new Set(syns).size, `${need} has duplicates`).toBe(syns.length);
    }
  });

  it('all keys are lowercase', () => {
    for (const need of Object.keys(NEED_SYNONYMS)) {
      expect(need, `${need} is not lowercase`).toBe(need.toLowerCase());
    }
  });

  it('all synonyms are lowercase', () => {
    for (const [need, syns] of Object.entries(NEED_SYNONYMS)) {
      for (const s of syns) {
        expect(s, `${need}: ${s} is not lowercase`).toBe(s.toLowerCase());
      }
    }
  });
});