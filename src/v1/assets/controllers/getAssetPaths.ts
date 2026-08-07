import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson } from '../../../lib/util';
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
               },
               select: {
                  rawJson: true
               },
               take: 1
            },
            paths: true
         }
      });

      // Check to make sure the asset exists
      if (!asset) {
         return notFoundError(c);
      }

      return c.json(
         asset.paths.map((path) => ({
            id: path.id,
            name: path.name,
            path: path.path,
            value: getValueFromJson<string>(JSON.parse(asset.json[0]?.rawJson), path.path)
         })),
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
