import { Hono } from 'hono';

import { prisma } from '../../../../lib/prisma';
import { internalServerError } from '../../../../lib/errorMessages';
import { assetInclude, serializeAsset } from '../../lib/util';
import { paginationQueryValidator } from '../../../../lib/validators';

export default new Hono().get('/', paginationQueryValidator({}), async (c) => {
   try {
      // Get information from the request
      const { page, limit } = c.req.valid('query');

      // Get all the storages
      const [upses, total] = await prisma.$transaction([
         prisma.asset.findMany({
            where: {
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
         }),

         prisma.storage.count()
      ]);

      return c.json(
         {
            upses: upses.map((ups) => ({
               ...serializeAsset(
                  { ...ups, jsonPosition: 0 },
                  {
                     capacity: ups.ups?.capacity
                  }
               )
            })),
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
         },
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
