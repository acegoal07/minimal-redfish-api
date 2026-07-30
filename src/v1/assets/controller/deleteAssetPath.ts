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
         const { id, pathId } = c.req.valid('param');

         // Get the path checking that in matches the asset id and the path id
         const path = await prisma.path.findFirst({
            where: {
               id: pathId,
               assetId: id
            }
         });

         // Checks if the path exists
         if (!path) {
            return notFoundError(c);
         }

         // Delete the path
         await prisma.path.delete({
            where: {
               id: pathId
            }
         });

         return c.json(204);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
