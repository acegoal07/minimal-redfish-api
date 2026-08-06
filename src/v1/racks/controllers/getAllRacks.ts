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
            prisma.storage.findMany({
               include: {
                  asset: true
               },
               skip: (page - 1) * limit,
               take: limit
            }),
            prisma.storage.count()
         ]);

         return c.json(
            {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
               racks: racks.map((rack) => ({
                  id: rack.id,
                  name: rack.asset.name,
                  size: rack.size,
                  notes: rack.asset.notes
               }))
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
