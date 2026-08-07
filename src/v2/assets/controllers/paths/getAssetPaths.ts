import { Hono } from 'hono';

import { prisma } from '../../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { validatePermissions } from '../../../../lib/util';
import { idParamValidator } from '../../../../lib/validators';
import { serializePath } from '../../lib/util';

export default new Hono().get('/', idParamValidator({}), async (c) => {
   try {
      // Check user permissions
      if (!validatePermissions(['asset.delete'], c)) {
         return forbiddenError(c);
      }

      // Get information from request
      const { id } = c.req.valid('param');

      // Try and get the asset from the database
      const asset = await prisma.asset.findUnique({
         where: {
            id
         },
         include: {
            paths: {
               select: {
                  id: true,
                  name: true,
                  path: true
               }
            },
            json: {
               select: {
                  rawJson: true
               }
            }
         }
      });

      // Check if the asset exists
      if (!asset) {
         return notFoundError(c);
      }

      return c.json(
         asset.paths.map((path) => {
            return serializePath(path, asset.json[0]?.rawJson);
         }),
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
