import { z } from 'zod';
import { CATEGORY_IDS } from './taxonomy';

export const patronageSchema = z.object({
  need: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9][a-z0-9 ,'&\/-]*$/, 'need must be lowercase')
    .refine((v) => v.trim().split(/\s+/).length <= 4, 'need must be at most 4 words'),
  category: z.enum(CATEGORY_IDS),
});

export const imageSchema = z.object({
  url: z.string().url(),
  attribution: z.string().min(1).max(500),
  altText: z.string().min(1).max(300).optional(),
});

export const prayerSchema = z.object({
  text: z.string().min(1).max(2000),
  source: z.enum(['traditional', 'original']),
});

export const saintSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  name: z.string().min(1).max(200),
  feastDay: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$|^unknown$/, 'feastDay must be MM-DD or "unknown"'),
  canonized: z.string().min(1).max(50).optional(),
  bio: z.string().min(10).max(10000),
  patronages: z.array(patronageSchema).min(1, 'at least one patronage is required'),
  prayer: prayerSchema.optional(),
  image: imageSchema.optional(),
  sources: z.array(z.string().url()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

export type Saint = z.infer<typeof saintSchema>;
