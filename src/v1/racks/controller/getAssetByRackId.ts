import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { internalServerError, invalidParametersError } from '../../../lib/errorMessages';
import { getValueFromJson } from '../../../lib/util';

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

               // Get the values for the asset paths from the json
               const assetPathsWithData = assetPaths.map((path) => {
                  return {
                     ...path,
                     value: getValueFromJson<string>(latestJsonHistory, path.path)
                  };
               });

               return {
                  id: asset.id,
                  name: asset.name,
                  position: asset.position,
                  size: asset.size,
                  rackId: asset.rackId,
                  data: assetPathsWithData.map((path) => ({
                     id: path.id,
                     name: path.name,
                     path: path.path,
                     value: path.value
                  })),
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
