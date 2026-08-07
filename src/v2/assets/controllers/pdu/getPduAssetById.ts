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
      const pdu = await prisma.asset.findUnique({
         where: {
            id,
            pdu: {
               isNot: null
            }
         },
         include: {
            ...assetInclude,
            pdu: {
               select: {
                  outletCount: true
               }
            }
         }
      });

      // Check if the storage exists
      if (!pdu) {
         return notFoundError(c);
      }

      return c.json(
         serializeAsset({ ...pdu, jsonPosition: 0 }, { outletCount: pdu.pdu?.outletCount }),
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
