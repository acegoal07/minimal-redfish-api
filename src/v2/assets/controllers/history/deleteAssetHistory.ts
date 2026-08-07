import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { validatePermissions } from '../../../../lib/util';
import { idParamValidator } from '../../../../lib/validators';

export default new Hono().delete(
   '/',
   idParamValidator({
      historyId: z.coerce
         .number({ error: 'Json ID must be a number' })
         .int({ error: 'Json ID must be a whole number' })
         .positive({ error: 'Json ID must be greater than 0' })
   }),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['asset.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id, historyId } = c.req.valid('param');

         // Get the path checking that in matches the asset id and the path id
         const jsonHistory = await prisma.assetJson.findFirst({
            where: {
               id: historyId,
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
         await prisma.assetJson.delete({
            where: {
               id: historyId
            }
         });

         return c.json(204);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
