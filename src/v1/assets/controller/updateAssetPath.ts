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

export default new Hono().patch(
   '/:id/path/:pathId',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'ID must be a number' })
            .int({ message: 'ID must be a whole number' })
            .positive({ message: 'ID must be greater than 0' }),
         pathId: z.coerce
            .number({ error: 'Path ID must be a number' })
            .int({ message: 'Path ID must be a whole number' })
            .positive({ message: 'Path ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidParametersError(c, result);
         }
      }
   ),
   zValidator(
      'json',
      z
         .object({
            name: z.string({ error: 'Name must be a string' }).trim().optional(),
            path: z.string({ error: 'Path must be a string' }).trim().optional()
         })
         .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field must be provided'
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

         // try and get the path from the database
         const oldPath = await prisma.path.findUnique({
            where: {
               id
            }
         });

         // Check that the path exists
         if (!oldPath) {
            return notFoundError(c);
         }

         // Update the path in the database
         const updatedPath = await prisma.path.update({
            data: {
               name: body.name ?? oldPath?.name,
               path: body.path ?? oldPath?.path
            },
            where: {
               id
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

         return c.json(
            {
               id: updatedPath.id,
               name: updatedPath.name,
               path: updatedPath.path,
               value: getValueFromJson<string>(latestJsonHistory, updatedPath.path)
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
