import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().delete('/', idParamValidator({}), async (c) => {
   try {
      // Check users permissions
      if (!validatePermissions(['role.delete'], c)) {
         return forbiddenError(c);
      }

      // Get request information
      const { id } = c.req.valid('param');

      // try and get the role from the database
      const role = await prisma.role.findUnique({
         where: {
            id
         },
         select: {
            id: true
         }
      });

      // Check if the role exists
      if (!role) {
         return notFoundError(c);
      }

      // Delete the template from the database
      await prisma.role.delete({
         where: {
            id
         }
      });

      return c.json(204);
   } catch (err) {
      return internalServerError(c, err);
   }
});
