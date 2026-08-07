import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import {
   existingResourceError,
   forbiddenError,
   internalServerError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { assetInclude, buildBaseAssetSchema, serializeAsset } from '../lib/util';
import { assetSchema } from '../lib/validator';
import { bodyValidator } from '../../../lib/validators';

export default new Hono().post('/', bodyValidator(assetSchema), async (c) => {
   try {
      // Check user permissions
      if (!validatePermissions(['asset.create'], c)) {
         return forbiddenError(c);
      }

      // Get request information
      const body = c.req.valid('json');

      // Try and get the asset from the database
      const existingAsset = await prisma.asset.findFirst({
         where: {
            name: body.name,
            storageType: {
               is: null
            },
            server: {
               is: null
            },
            ups: {
               is: null
            },
            pdu: {
               is: null
            }
         },
         select: {
            id: true
         }
      });

      // Check if a asset exists
      if (existingAsset) {
         return existingResourceError(c);
      }

      // Add the new asset to the database
      const newAsset = await prisma.asset.create({
         data: {
            ...buildBaseAssetSchema(body)
         },
         include: {
            ...assetInclude,
            storage: {
               include: {
                  asset: {
                     select: {
                        name: true
                     }
                  }
               }
            }
         }
      });

      return c.json(serializeAsset({ ...newAsset, jsonPosition: 0 }), 201);
   } catch (err) {
      return internalServerError(c, err);
   }
});
