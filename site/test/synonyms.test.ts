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

  it('has no more than 10 synonyms per need', () => {
    for (const [need, syns] of Object.entries(NEED_SYNONYMS)) {
      expect(syns.length, `${need} has ${syns.length} synonyms (max 10)`).toBeLessThanOrEqual(10);
    }
  });

  it('no synonym equals its key', () => {
    for (const [need, syns] of Object.entries(NEED_SYNONYMS)) {
      expect(syns, `${need} contains itself as a synonym`).not.toContain(need);
    }
  });
});
