import { Hono } from 'hono';

import { prisma } from '../../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { assetInclude, serializeAsset } from '../../lib/util';
import { idParamValidator } from '../../../../lib/validators';

export default new Hono().get('/', idParamValidator({}), async (c) => {
   try {
      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the ups from the asset from
      const ups = await prisma.asset.findUnique({
         where: {
            id,
            ups: {
               isNot: null
            }
         },
         include: {
            ...assetInclude,
            ups: {
               select: {
                  capacity: true
               }
            }
         }
      });

      // Check if the storage exists
      if (!ups) {
         return notFoundError(c);
      }

      return c.json(
         serializeAsset({ ...ups, jsonPosition: 0 }, { capacity: ups.ups?.capacity }),
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
