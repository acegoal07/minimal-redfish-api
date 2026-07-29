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
   '/:id/path',
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

         // Get the latest json history for the asset
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
               id: path.id,
               name: path.name,
               path: path.path,
               value: getValueFromJson<string>(latestJsonHistory, path.path)
            };
         });

         return c.json(assetPathsWithData, 200);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
