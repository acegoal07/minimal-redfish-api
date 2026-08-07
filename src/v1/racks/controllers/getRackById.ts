import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../lib/errorMessages';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().get('/', idParamValidator({}), async (c) => {
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
});
