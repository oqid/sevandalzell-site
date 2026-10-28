/* ============================================================
   CONTENT SCHEMAS
   This file defines what fields each kind of content has.
   Add a field here + use it in a component, and Astro will
   error at build time if any entry is missing it or has a typo.
   ============================================================ */
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// A date can be written as 2026, 2026-03 or 2026-03-14.
const looseDate = z
  .union([z.number(), z.string(), z.date()])
  .transform((v) => {
    const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
    const [y, m] = s.split('-');
    return { year: Number(y), month: m ? Number(m) : undefined, raw: s };
  });

const projects = defineCollection({
  // One folder per project: src/content/projects/<slug>/index.md,
  // with that project's images sitting next to it.
  loader: glob({ pattern: '*/index.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // When it started, and when it ended. Leave `end` out if it was a
      // one-off; set `ongoing: true` if it's still going.
      start: looseDate,
      end: looseDate.optional(),
      ongoing: z.boolean().default(false),
      role: z.string().optional(),
      tags: z.array(z.string()).default([]),
      // Lower numbers come first on the portfolio page.
      order: z.number().default(100),
      // feature → full-width image with the extra media in a strip below.
      // standard → image beside the text, multiple media crossfade.
      display: z.enum(['standard', 'feature']).default('standard'),
      draft: z.boolean().default(false),
      // A YouTube video shown full width after the photos (feature
      // projects) or after the gallery (project page). `poster` is
      // optional: your own still, otherwise YouTube's thumbnail.
      film: z
        .object({
          youtube: z.string(), // the ID: the bit after youtu.be/
          title: z.string(),
          poster: image().optional(),
        })
        .optional(),
      media: z
        .array(
          z.union([
            z.object({
              image: image(),
              alt: z.string().default(''),
              caption: z.string().optional(),
            }),
            z.object({
              video: z.string().url(),
              poster: z.string().url().optional(),
              alt: z.string().default(''),
              caption: z.string().optional(),
            }),
          ]),
        )
        .min(1),
    }),
});

const photos = defineCollection({
  // Every photo is one entry in src/content/photos/photos.yaml.
  loader: file('./src/content/photos/photos.yaml'),
  schema: ({ image }) =>
    z.object({
      image: image(),
      title: z.string(),
      alt: z.string().default(''),
      camera: z.string().optional(),
      lens: z.string().optional(),
      date: looseDate.optional(),
      // Who it was shot for, e.g. "Rainbow Engineering". Optional.
      client: z.string().optional(),
    }),
});

export const collections = { projects, photos };
