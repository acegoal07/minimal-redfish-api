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
            query: z.string().trim().optional()
         })
         .transform((value) => ({
            query: value.query,
            id: value.query ? Number(value.query) : undefined
         }))
   ),
   async (c) => {
      // Check users permissions
      if (!validatePermissions(['rack.read'], c)) {
         return forbiddenError(c);
      }

      // Get request information
      const { query, id } = c.req.valid('query');

      if (!query) {
         return c.json([], 200);
      }

      try {
         const racks = await prisma.rack.findMany({
            where: {
               OR: [
                  ...(Number.isInteger(id) ? [{ id }] : []),
                  {
                     name: {
                        contains: query
                     }
                  }
               ]
            }
         });

         return c.json(
            racks.map((rack) => ({
               id: rack.id,
               name: rack.name,
               size: rack.size,
               notes: rack.notes
            })),
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
