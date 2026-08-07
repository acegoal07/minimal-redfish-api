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
         outletCount: z
            .number({ error: 'Outlet count must be a number' })
            .int({ error: 'Outlet count must be an integer' })
            .positive({ error: 'Outlet count must be greater than 0' })
            .default(0)
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
         const existingPdu = await prisma.asset.findFirst({
            where: {
               name: body.name,
               pdu: {
                  isNot: null
               }
            },
            select: {
               id: true
            }
         });

         // Check if a ups exists
         if (existingPdu) {
            return existingResourceError(c);
         }

         // Add the new ups to the database
         const newPdu = await prisma.asset.create({
            data: {
               ...buildBaseAssetSchema(body),
               pdu: {
                  create: {
                     outletCount: body.outletCount
                  }
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

         return c.json(
            serializeAsset(
               { ...newPdu, jsonPosition: 0 },
               {
                  outletCount: newPdu.pdu?.outletCount
               }
            ),
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
