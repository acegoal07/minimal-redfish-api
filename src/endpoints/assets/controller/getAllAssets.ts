import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { getValueFromJson } from '../../../lib/util';
import { internalServerError } from '../../../lib/errorMessages';

export default new Hono().get('/', async (c) => {
   try {
      const assets = await prisma.asset.findMany();

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
               ...asset,
               data: assetPathsWithData,
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
});
