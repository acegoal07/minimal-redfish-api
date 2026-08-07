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
      const [storages, total] = await prisma.$transaction([
         prisma.asset.findMany({
            where: {
               storageType: {
                  isNot: null
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
         }),

         prisma.storage.count()
      ]);

      return c.json(
         {
            storages: storages.map((storage) => ({
               ...serializeAsset(
                  { ...storage, jsonPosition: 0 },
                  {
                     size: storage.storageType?.size
                  }
               )
            })),
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
