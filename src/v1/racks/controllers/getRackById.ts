import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   forbiddenError,
   internalServerError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';

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
         // Check users permissions
         if (!validatePermissions(['rack.read'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');

         // Try and get the rack from the database
         const rack = await prisma.rack.findUnique({
            where: {
               id
            },
            select: {
               id: true,
               name: true,
               size: true,
               notes: true
            }
         });

         // Check if the rack exists
         if (!rack) {
            return notFoundError(c);
         }

         return c.json(
            {
               name: rack.name,
               id: rack.id,
               size: rack.size,
               notes: rack.notes
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
