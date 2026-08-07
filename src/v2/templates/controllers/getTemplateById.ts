import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().get('/', idParamValidator({}), async (c) => {
   try {
      // Check users permissions
      if (!validatePermissions(['template.read'], c)) {
         return forbiddenError(c);
      }

      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the rack from the database
      const template = await prisma.template.findUnique({
         where: {
            id
         },
         include: {
            paths: true
         }
      });

      // Check if the rack exists
      if (!template) {
         return notFoundError(c);
      }

      return c.json(
         {
            id: template.id,
            name: template.name,
            paths: template.paths.map((path) => ({
               id: path.id,
               name: path.name,
               path: path.path
            }))
         },
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
