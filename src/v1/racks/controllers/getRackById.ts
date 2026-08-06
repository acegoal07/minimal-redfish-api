import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   internalServerError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().get(
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
            return invalidParametersError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Get request information
         const { id } = c.req.valid('param');

         // Try and get the rack from the database
         const rack = await prisma.asset.findFirst({
            where: {
               id,
               storageType: {
                  isNot: null
               }
            },
            include: {
               storageType: true
            }
         });

         const test = await prisma.storage.findUnique({
            where: {
               id: id
            }
         });

         console.log(rack);
         console.log(test);

         // Check if the rack exists
         if (!rack) {
            return notFoundError(c);
         }

         return c.json(
            {
               name: rack.name,
               id: rack.id,
               size: rack.storageType?.size,
               notes: rack.notes
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
