import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../lib/errorMessages';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().delete('/', idParamValidator({}), async (c) => {
   try {
      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the group from the database
      const group = await prisma.group.findUnique({
         where: {
            id
         }
      });

      // Check if the group exists
      if (!group) {
         return notFoundError(c);
      }

      return c.json(
         {
            id: group.id,
            name: group.name
         },
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
