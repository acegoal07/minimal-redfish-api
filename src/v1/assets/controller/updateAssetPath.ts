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
   '/:id/paths/:pathId',
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
         const { id, pathId } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id: id
            },
            include: {
               jsonHistory: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  take: 1
               },
               paths: {
                  where: {
                     id: pathId
                  }
               }
            }
         });

         // Check whether the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         // Check that the path exists
         if (!asset.paths[0]) {
            return notFoundError(c);
         }

         // Update the path in the database
         const updatedPath = await prisma.path.update({
            data: {
               name: body.name ?? asset.paths[0]?.name,
               path: body.path ?? asset.paths[0]?.path
            },
            where: {
               id
            }
         });

         return c.json(
            {
               id: updatedPath.id,
               name: updatedPath.name,
               path: updatedPath.path,
               value: getValueFromJson<string>(
                  JSON.parse(asset.jsonHistory[0].rawJson),
                  updatedPath.path
               )
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
