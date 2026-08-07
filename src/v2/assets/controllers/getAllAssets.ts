import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { assetInclude, serializeAsset } from '../lib/util';
import { paginationQueryValidator } from '../../../lib/validators';

export default new Hono().get('/', paginationQueryValidator({}), async (c) => {
   try {
      // Get request information
      const { page, limit } = c.req.valid('query');

      // Get all the assets
      const [assets, total] = await prisma.$transaction([
         prisma.asset.findMany({
            include: {
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
});
