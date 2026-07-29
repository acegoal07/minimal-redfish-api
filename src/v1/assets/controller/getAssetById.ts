import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getValueFromJson } from '../../../lib/util';
import {
   internalServerError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().get(
   '/:id',
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

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id
            }
         });

         // Check to make sure the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         // Get all the data fields from the database
         const assetPaths = await prisma.path.findMany({
            where: {
               assetId: id
            }
         });

         // Get the total number of json history items in the database for the asset
         const totalJsonHistory = await prisma.jsonHistory.count({
            where: {
               assetId: id
            }
         });

         // Get the latest json for the asset from the database
         const latestJsonHistory = await prisma.jsonHistory.findFirst({
            where: {
               assetId: id
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

         return c.json(
            {
               success: true,
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
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
