import { Hono } from 'hono';

import { prisma } from '../../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { assetInclude, serializeAsset } from '../../lib/util';
import { idParamValidator } from '../../../../lib/validators';

export default new Hono().get('/', idParamValidator({}), async (c) => {
   try {
      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the server from the asset from
      const server = await prisma.asset.findUnique({
         where: {
            id,
            server: {
               isNot: null
            }
         },
         include: {
            storage: {
               include: {
                  asset: {
                     select: {
                        name: true
                     }
                  }
               }
            },
            ...assetInclude
         }
      });

      // Check if the server exists
      if (!server) {
         return notFoundError(c);
      }

      return c.json(serializeAsset({ ...server, jsonPosition: 0 }), 200);
   } catch (err) {
      return internalServerError(c, err);
   }
});
