import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson, validatePermissions } from '../../../lib/util';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { bodyValidator, idParamValidator } from '../../../lib/validators';

export default new Hono().post(
   '/',
   idParamValidator({}),
   bodyValidator(
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
      })
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['asset.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the asset from the database
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
            newPaths.paths.map((path) => ({
               id: path.id,
               path: path.path,
               name: path.name,
               value: getValueFromJson<string>(JSON.parse(asset.json[0]?.rawJson ?? {}), path.path)
            })),
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
