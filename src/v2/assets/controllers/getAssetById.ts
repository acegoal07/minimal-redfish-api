import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../lib/errorMessages';
import { assetInclude, serializeAsset } from '../lib/util';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().get('/', idParamValidator({}), async (c) => {
   try {
      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the asset from the asset from
      const asset = await prisma.asset.findUnique({
         where: {
            id
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

      // Check if the asset exists
      if (!asset) {
         return notFoundError(c);
      }

      return c.json(serializeAsset({ ...asset, jsonPosition: 0 }), 200);
   } catch (err) {
      return internalServerError(c, err);
   }
});
