import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   internalServerError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().delete(
   '/',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'Asset ID must be a number' })
            .int({ message: 'Asset ID must be a whole number' })
            .positive({ message: 'Asset ID must be greater than 0' }),
         jsonId: z.coerce
            .number({ error: 'Json ID must be a number' })
            .int({ message: 'Json ID must be a whole number' })
            .positive({ message: 'Json ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidParametersError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         const { id, jsonId } = c.req.valid('param');

         // Get the path checking that in matches the asset id and the path id
         const jsonHistory = await prisma.jsonHistory.findFirst({
            where: {
               id: jsonId,
               assetId: id
            },
            select: {
               id: true
            }
         });

         // Checks if the path exists
         if (!jsonHistory) {
            return notFoundError(c);
         }

         // Delete the path
         await prisma.jsonHistory.delete({
            where: {
               id: jsonId
            }
         });

         return c.json(204);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
