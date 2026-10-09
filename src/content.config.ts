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
    // Replaces the static figure with an interactive one on the project page
    interactive: z.enum(['thermal']).optional(),
    figure: z
      .object({
        diagram: z
          .enum(['calibration-target', 'depth-histogram', 'pick-order', 'occupancy-grid', 'depth-profile', 'thermal-plate'])
          .optional(),
        caption: z.string(),
      })
      .optional(),
  }),
});

export const collections = { projects };
