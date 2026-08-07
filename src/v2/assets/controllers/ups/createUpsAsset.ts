import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import {
   existingResourceError,
   forbiddenError,
   internalServerError
} from '../../../../lib/errorMessages';
import { validatePermissions } from '../../../../lib/util';
import { assetInclude, buildBaseAssetSchema, serializeAsset } from '../../lib/util';
import { assetSchema } from '../../lib/validator';
import { bodyValidator } from '../../../../lib/validators';

export default new Hono().post(
   '/',
   bodyValidator(
      assetSchema.extend({
         capacity: z
            .number({ error: 'Capacity must be a number' })
            .positive({ error: 'Capacity must be greater than 0' })
            .default(1)
      })
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['asset.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const body = c.req.valid('json');

         // Try and get the ups asset from the database
         const existingUps = await prisma.asset.findFirst({
            where: {
               name: body.name,
               ups: {
                  isNot: null
               }
            },
            select: {
               id: true
            }
         });

         // Check if a ups exists
         if (existingUps) {
            return existingResourceError(c);
         }

         // Add the new ups to the database
         const newUps = await prisma.asset.create({
            data: {
               ...buildBaseAssetSchema(body),
               ups: {
                  create: {
                     capacity: body.capacity
                  }
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

         return c.json(
            serializeAsset(
               { ...newUps, jsonPosition: 0 },
               {
                  capacity: newUps.ups?.capacity
               }
            ),
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
