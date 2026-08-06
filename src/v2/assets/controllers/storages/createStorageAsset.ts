import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import {
   existingResourceError,
   forbiddenError,
   internalServerError,
   invalidBodyError
} from '../../../../lib/errorMessages';
import { validatePermissions } from '../../../../lib/util';
import { assetExists, assetInclude, buildBaseAssetSchema, serializeAsset } from '../../lib/util';
import { assetSchema } from '../../lib/validator';

export default new Hono().post(
   '/',
   zValidator(
      'json',
      assetSchema.extend({
         size: z
            .number({ error: 'Size must be a number' })
            .int({ error: 'Size must be an integer' })
            .positive({ error: 'Size must be greater than 0' })
            .default(1)
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['asset.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const body = c.req.valid('json');

         // Try and get the storage asset from the database
         const existingStorage = await assetExists(body.name);

         // Check if a tag exists
         if (existingStorage) {
            return existingResourceError(c);
         }

         // Add the new storage to the database
         const newStorage = await prisma.asset.create({
            data: {
               ...buildBaseAssetSchema(body),
               storageType: {
                  create: {
                     size: body.size
                  }
               }
            },
            include: {
               ...assetInclude,
               storageType: {
                  select: {
                     size: true
                  }
               }
            }
         });

         return c.json(
            serializeAsset(newStorage, {
               model: newStorage.storageType?.size
            }),
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
