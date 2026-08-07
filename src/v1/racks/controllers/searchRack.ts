import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { queryValidator } from '../../../lib/validators';

export default new Hono().get(
   '/',
   queryValidator(
      z
         .object({
            query: z.string().trim().optional(),
            page: z.coerce
               .number({ error: 'Page must be a number' })
               .int({ error: 'Page must be an integer' })
               .positive({ error: 'Page must be 1 or greater' })
               .default(1),
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
         // Get request information
         const { query, id, page, limit } = c.req.valid('query');

         // Returns blank if there is no query
         if (!query) {
            return c.json([], 200);
         }

         // Search for racks
         const [racks, total] = await prisma.$transaction([
            prisma.asset.findMany({
               where: {
                  OR: [
                     ...(Number.isInteger(id) ? [{ id }] : []),
                     {
                        name: {
                           contains: query
                        }
                     }
                  ],
                  storageType: {
                     isNot: null
                  }
               },
               include: {
                  storageType: true
               },
               skip: (page - 1) * limit,
               take: limit
            }),

            prisma.asset.count({
               where: {
                  storageType: {
                     isNot: null
                  }
               }
            })
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
                  size: rack.storageType?.size,
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
