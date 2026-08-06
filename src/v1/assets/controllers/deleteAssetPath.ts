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

export default new Hono().delete(
   '/',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'Asset ID must be a number' })
            .int({ error: 'Asset ID must be a whole number' })
            .positive({ error: 'Asset ID must be greater than 0' }),
         pathId: z.coerce
            .number({ error: 'Path ID must be a number' })
            .int({ error: 'Path ID must be a whole number' })
            .positive({ error: 'Path ID must be greater than 0' })
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
         if (!validatePermissions(['asset.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id, pathId } = c.req.valid('param');

         // Get the path checking that in matches the asset id and the path id
         const path = await prisma.assetPath.findFirst({
            where: {
               id: pathId,
               assetId: id
            },
            select: {
               id: true
            }
         });

         // Checks if the path exists
         if (!path) {
            return notFoundError(c);
         }

         // Delete the path
         await prisma.assetPath.delete({
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
