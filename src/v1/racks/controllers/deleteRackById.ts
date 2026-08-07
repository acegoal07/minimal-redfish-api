import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().delete('/', idParamValidator({}), async (c) => {
   try {
      // Check users permissions
      if (!validatePermissions(['asset.delete'], c)) {
         return forbiddenError(c);
      }

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
         select: {
            id: true
         }
      });

      // Check if the rack exists
      if (!rack) {
         return notFoundError(c);
      }

      // Delete the rack from the database
      await prisma.asset.delete({
         where: {
            id
         }
      });

      return c.json(204);
   } catch (err) {
      return internalServerError(c, err);
   }
});
