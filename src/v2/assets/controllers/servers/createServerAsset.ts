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
         model: z.string({ error: 'Model must be a string' }).trim().optional()
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

         // Try and get the server asset from the database
         const existingServer = await prisma.asset.findFirst({
            where: {
               name: body.name,
               server: {
                  isNot: null
               }
            },
            select: {
               id: true
            }
         });

         // Check if a server exists
         if (existingServer) {
            return existingResourceError(c);
         }

         // Add the new server to the database
         const newServer = await prisma.asset.create({
            data: {
               ...buildBaseAssetSchema(body),
               server: {
                  create: {
                     model: body.model
                  }
               }
            },
            include: {
               ...assetInclude,
               server: {
                  select: {
                     model: true
                  }
               }
            }
         });

         return c.json(
            serializeAsset(
               { ...newServer, jsonPosition: 0 },
               {
                  model: newServer.server?.model
               }
            ),
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
