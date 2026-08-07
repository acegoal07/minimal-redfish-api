import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().delete('/', idParamValidator({}), async (c) => {
   try {
      // Check user permissions
      if (!validatePermissions(['asset.delete'], c)) {
         return forbiddenError(c);
      }

      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the asset from the database
      const existingAsset = await prisma.asset.findUnique({
         where: {
            id
         },
         select: {
            id: true
         }
      });

      // Check if the asset exists
      if (!existingAsset) {
         return notFoundError(c);
      }

      // Delete the asset the database
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
