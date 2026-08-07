import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { validatePermissions } from '../../../../lib/util';
import { idParamValidator } from '../../../../lib/validators';

export default new Hono().delete(
   '/',
   idParamValidator({
      pathId: z.coerce
         .number({ error: 'Path ID must be a number' })
         .int({ error: 'Path ID must be a whole number' })
         .positive({ error: 'Path ID must be greater than 0' })
   }),
   async (c) => {
      try {
         if (!validatePermissions(['asset.delete'], c)) {
            return forbiddenError(c);
         }

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
