import { z } from 'zod';

export const assetSchema = z.object({
   name: z
      .string({ error: 'Name must be a string' })
      .trim()
      .min(1, { error: 'Name cannot be empty' }),

   paths: z
      .array(
         z.object({
            name: z
               .string({ error: 'Name must be a string' })
               .trim()
               .min(1, { error: 'Name cannot be empty' }),
            path: z
               .string({ error: 'Path must be a string' })
               .trim()
               .min(1, { error: 'Path cannot be empty' })
         })
      )
      .default([]),

   group: z
      .number({ error: 'Group ID must be a number' })
      .int({ error: 'Group ID must be an integer' })
      .positive({ error: 'Group ID must be greater than 0' })
      .optional(),

   tags: z
      .array(
         z
            .number({ error: 'Tag ID must be a number' })
            .int({ error: 'Tag ID must be an integer' })
            .positive({ error: 'Tag ID must be greater than 0' })
      )
      .default([])
});
