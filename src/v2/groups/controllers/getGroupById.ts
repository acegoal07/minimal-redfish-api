import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { internalServerError, invalidBodyError, notFoundError } from '../../../lib/errorMessages';

export default new Hono().delete(
   '/',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'ID must be a number' })
            .int({ error: 'ID must be a whole number' })
            .positive({ error: 'ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Get request information
         const { id } = c.req.valid('param');

         // Try and get the group from the database
         const group = await prisma.group.findUnique({
            where: {
               id
            }
         });

         // Check if the group exists
         if (!group) {
            return notFoundError(c);
         }

         return c.json(
            {
               id: group.id,
               name: group.name
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
