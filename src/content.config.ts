import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    outcome: z.string(),
    order: z.number(),
    employer: z.string(),
    period: z.string(),
    tags: z.array(z.string()),
    figure: z
      .object({
        diagram: z
          .enum(['calibration-target', 'depth-histogram', 'pick-order', 'occupancy-grid', 'depth-profile'])
          .optional(),
        caption: z.string(),
      })
      .optional(),
  }),
});

export const collections = { projects };
