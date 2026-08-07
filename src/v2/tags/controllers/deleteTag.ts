import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().delete('/', idParamValidator({}), async (c) => {
   try {
      // Check user permissions
      if (!validatePermissions(['tag.delete'], c)) {
         return forbiddenError(c);
      }

      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the tag from the database
      const existingTag =
         (await prisma.tag.findUnique({
            where: {
               id
            },
            select: {
               id: true
            }
         })) !== null;

      // Check if the tag exists
      if (!existingTag) {
         return notFoundError(c);
      }

      // Delete the group the database
      await prisma.tag.delete({
         where: {
            id
         }
      });

      return c.json(204);
   } catch (err) {
      return internalServerError(c, err);
   }
});
