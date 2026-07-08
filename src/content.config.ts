import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const sims = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/sims' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publish: z.boolean(),
    render: z.enum(['canvas2d', 'glowscript']),
    glowscript_version: z.string(),
    folder_origin: z.string(),
    sort: z.number().default(99),
  }),
});

export const collections = { sims };
