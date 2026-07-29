import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
   internalServerError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().delete(
   '/:id/path/:pathId',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'Asset ID must be a number' })
            .int({ message: 'Asset ID must be a whole number' })
            .positive({ message: 'Asset ID must be greater than 0' }),

         pathId: z.coerce
            .number({ error: 'Path ID must be a number' })
            .int({ message: 'Path ID must be a whole number' })
            .positive({ message: 'Path ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidParametersError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         const { id } = c.req.valid('param');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id: id
            }
         });

         // Check whether the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         // try and get the path from the database
         const path = await prisma.path.findUnique({
            where: {
               id
            }
         });

         // Check that the path exists
         if (!path) {
            return notFoundError(c);
         }

         return c.json(204);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
