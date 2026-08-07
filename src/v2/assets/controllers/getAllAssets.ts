import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { assetInclude, serializeAsset } from '../lib/util';
import { queryValidator } from '../../../lib/validators';

export default new Hono().get(
   '/',
   queryValidator(
      z.object({
         page: z.coerce
            .number({ error: 'Page must be a number' })
            .int({ error: 'Page must be an integer' })
            .positive({ error: 'Page must be 1 or greater' })
            .default(1),
         limit: z.coerce
            .number({ error: 'Limit must be a number' })
            .int({ error: 'Limit must be an integer' })
            .positive({ error: 'Limit must be greater than 0' })
            .default(25)
      })
   ),
   async (c) => {
      try {
         // Get request information
         const { page, limit } = c.req.valid('query');

         // Get all the assets
         const [assets, total] = await prisma.$transaction([
            prisma.asset.findMany({
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
               },
               skip: (page - 1) * limit,
               take: limit
            }),

            prisma.asset.count()
         ]);

         return c.json(
            {
               assets: assets.map((asset) => serializeAsset({ ...asset, jsonPosition: 0 })),
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit)
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
