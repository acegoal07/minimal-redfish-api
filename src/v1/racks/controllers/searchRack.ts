import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';

export default new Hono().get(
   '/',
   zValidator(
      'query',
      z
         .object({
            query: z.string().trim().optional(),
            page: z.coerce
               .number({ error: 'Page must be a number' })
               .int({ error: 'Page must be an integer' })
               .nonnegative({ error: 'Page must be 0 or greater' })
               .default(0),
            limit: z.coerce
               .number({ error: 'Limit must be a number' })
               .int({ error: 'Limit must be an integer' })
               .positive({ error: 'Limit must be greater than 0' })
               .default(25)
         })
         .transform((value) => ({
            query: value.query,
            id: value.query ? Number(value.query) : undefined,
            page: value.page,
            limit: value.limit
         }))
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['rack.read'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { query, id, page, limit } = c.req.valid('query');

         // Returns blank if there is no query
         if (!query) {
            return c.json([], 200);
         }

         // Search for racks
         const [racks, total] = await prisma.$transaction([
            prisma.rack.findMany({
               where: {
                  OR: [
                     ...(Number.isInteger(id) ? [{ id }] : []),
                     {
                        name: {
                           contains: query
                        }
                     }
                  ]
               },
               select: {
                  id: true,
                  name: true,
                  size: true,
                  notes: true
               },
               skip: page * limit,
               take: limit
            }),
            prisma.rack.count()
         ]);

         return c.json(
            {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
               racks: racks.map((rack) => ({
                  id: rack.id,
                  name: rack.name,
                  size: rack.size,
                  notes: rack.notes
               }))
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
