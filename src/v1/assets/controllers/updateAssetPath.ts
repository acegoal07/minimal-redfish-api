import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson, validatePermissions } from '../../../lib/util';
import {
   forbiddenError,
   internalServerError,
   invalidBodyError,
   notFoundError
} from '../../../lib/errorMessages';
import { bodyValidator, idParamValidator } from '../../../lib/validators';

export default new Hono().patch(
   '/',
   idParamValidator({
      pathId: z.coerce
         .number({ error: 'Path ID must be a number' })
         .int({ error: 'Path ID must be a whole number' })
         .positive({ error: 'Path ID must be greater than 0' })
   }),
   bodyValidator(
      z
         .object({
            name: z.string({ error: 'Name must be a string' }).trim().optional(),
            path: z.string({ error: 'Path must be a string' }).trim().optional()
         })
         .refine((data) => Object.keys(data).length > 0, {
            error: 'At least one field must be provided'
         })
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['asset.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id, pathId } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id: id,
               server: {
                  isNot: null
               }
            },
            include: {
               json: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  select: {
                     rawJson: true
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
         const updatedPath = await prisma.assetPath.update({
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
               value: getValueFromJson<string>(JSON.parse(asset.json[0]?.rawJson), updatedPath.path)
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
