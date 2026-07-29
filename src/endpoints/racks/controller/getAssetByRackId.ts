import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { internalServerError, invalidParametersError } from '../../../lib/errorMessages';

export default new Hono().get(
   '/:id/assets',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'ID must be a number' })
            .int({ message: 'ID must be a whole number' })
            .positive({ message: 'ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidParametersError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         const { id } = c.req.valid('param');

         // Get all the assets using the id of the rack they are linked to
         const assets = await prisma.asset.findMany({
            where: {
               rackId: id
            }
         });

         // Go through each asset and gather the asset data
         const assetsWithJson = await Promise.all(
            assets.map(async (asset) => {
               // Get all the data fields from the database
               const assetPaths = await prisma.path.findMany({
                  where: {
                     assetId: asset.id
                  }
               });

               // Get the total number of json history items in the database for the asset
               const totalJsonHistory = await prisma.jsonHistory.count({
                  where: {
                     assetId: asset.id
                  }
               });

               // Get the latest json history for the asset
               const latestJsonHistory = await prisma.jsonHistory.findFirst({
                  where: {
                     assetId: asset.id
                  },
                  orderBy: {
                     uploadDate: 'desc'
                  }
               });

               return {
                  ...asset,
                  data: assetPaths.map((assetId, ...rest) => ({ ...rest })),
                  json: {
                     text: latestJsonHistory?.rawJson,
                     filename: latestJsonHistory?.filename
                  },
                  pagination: {
                     position: 0,
                     total: totalJsonHistory
                  }
               };
            })
         );

         return c.json(assetsWithJson, 200);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
