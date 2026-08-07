import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../lib/errorMessages';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().get('/', idParamValidator({}), async (c) => {
   try {
      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the asset from the database
      const asset = await prisma.asset.findUnique({
         where: {
            id,
            server: {
               isNot: null
            }
         },
         include: {
            json: {
               orderBy: {
                  uploadDate: 'desc'
               }
            }
         }
      });

      // Check to make sure the asset exists
      if (!asset) {
         return notFoundError(c);
      }

      return c.json(
         asset.json.map((json) => ({
            id: json.id,
            text: json.rawJson
         })),
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
