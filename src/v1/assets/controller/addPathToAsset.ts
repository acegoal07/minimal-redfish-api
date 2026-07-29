import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getValueFromJson } from '../../../lib/util';
import {
   internalServerError,
   invalidBodyError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().post(
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
   zValidator(
      'json',
      z.object({
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { message: 'Name cannot be empty' }),
         path: z
            .string({ error: 'Path must be a string' })
            .trim()
            .min(1, { message: 'Path cannot be empty' })
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
         const body = c.req.valid('json');

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

         // Add the new path to the database
         const newPath = await prisma.path.create({
            data: {
               ...body,
               assetId: id
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

         return c.json(
            {
               success: true,
               id: newPath.id,
               path: newPath.path,
               name: newPath.name,
               value: getValueFromJson<string>(latestJsonHistory, body.path)
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
