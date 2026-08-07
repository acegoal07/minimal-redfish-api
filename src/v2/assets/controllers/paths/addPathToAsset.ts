import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { getValueFromJson, validatePermissions } from '../../../../lib/util';
import {
   forbiddenError,
   internalServerError,
   invalidBodyError,
   invalidParametersError,
   notFoundError
} from '../../../../lib/errorMessages';
import { idParamValidator } from '../../../../lib/validators';
import { serializePath } from '../../lib/util';

export default new Hono().post(
   '/',
   idParamValidator,
   zValidator(
      'json',
      z.object({
         paths: z
            .array(
               z.object({
                  name: z
                     .string({ error: 'Name must be a string' })
                     .trim()
                     .min(1, { error: 'Name cannot be empty' }),
                  path: z
                     .string({ error: 'Path must be a string' })
                     .trim()
                     .min(1, { error: 'Path cannot be empty' })
               })
            )
            .min(1, {
               error: 'At least one path is required'
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
         // Check users permissions
         if (!validatePermissions(['asset.update'], c)) {
            return forbiddenError(c);
         }

         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         const asset = await prisma.asset.findFirst({
            where: {
               id,
               server: {
                  isNot: null
               }
            },
            include: {
               json: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  take: 1,
                  select: {
                     rawJson: true
                  }
               }
            }
         });

         // Check whether the asset exists
         if (!asset) {
            return notFoundError(c);
         }
         // Add all the new paths to the asset
         const newPaths = await prisma.asset.update({
            where: {
               id,
               server: {
                  isNot: null
               }
            },
            data: {
               paths: {
                  createMany: {
                     data: body.paths.map((path) => ({
                        name: path.name,
                        path: path.path
                     }))
                  }
               }
            },
            include: {
               paths: true
            }
         });

         return c.json(
            newPaths.paths.map((path) => {
               return serializePath(path, asset.json[0]?.rawJson);
            }),
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
