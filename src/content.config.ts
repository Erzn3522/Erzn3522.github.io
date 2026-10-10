import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    outcome: z.string(),
    order: z.number(),
    employer: z.string(),
    period: z.string(),
    tags: z.array(z.string()),
    // Replaces the static figure with an interactive one on the project page
    interactive: z.enum(['thermal']).optional(),
    // The body (MDX) places its own figures; skip the figure block under the title
    inlineFigures: z.boolean().optional(),
    figure: z
      .object({
        diagram: z
          .enum(['calibration-target', 'depth-histogram', 'pick-order', 'occupancy-grid', 'depth-profile', 'thermal-plate', 'attention-matrix'])
          .optional(),
        caption: z.string(),
      })
      .optional(),
  }),
});

export const collections = { projects };
