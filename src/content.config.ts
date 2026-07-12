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
    /** the program's name on glowscript.org, preserved on the page per Dylan */
    original_name: z.string().optional(),
    folder_origin: z.string(),
    sort: z.number().default(99),
  }),
});

export const collections = { sims };
