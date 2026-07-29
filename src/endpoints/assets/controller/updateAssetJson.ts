import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
   internalServerError,
   invalidBodyError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().post(
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
   zValidator(
      'json',
      z.object({
         json: z.object({
            text: z
               .string({ error: 'Text must be a string' })
               .trim()
               .min(1, { message: 'Text cannot be empty' }),
            filename: z
               .string({ error: 'Filename must be a string' })
               .trim()
               .min(1, { message: 'Filename cannot be empty' })
         })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         const { id } = c.req.valid('param');
         const { json } = c.req.valid('json');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id: id
            }
         });

         // Check whether the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         // Add a new json to the history if a json is passed in
         await prisma.jsonHistory.create({
            data: {
               assetId: id,
               rawJson: json.text,
               filename: json.filename
            }
         });

         // Get all the asset paths from the database
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

         return c.json(
            {
               success: true,
               ...asset,
               data: assetPaths.map((assetId, ...rest) => ({ ...rest })),
               json,
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
