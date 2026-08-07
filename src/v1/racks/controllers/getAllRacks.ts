import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { queryValidator } from '../../../lib/validators';

export default new Hono().get(
   '/',
   queryValidator(
      z.object({
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
   ),
   async (c) => {
      try {
         // Get request information
         const { page, limit } = c.req.valid('query');

         // Get all the racks
         const [racks, total] = await prisma.$transaction([
            prisma.asset.findMany({
               where: {
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
