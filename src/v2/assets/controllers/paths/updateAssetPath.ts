import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { validatePermissions } from '../../../../lib/util';
import { bodyValidator, idParamValidator } from '../../../../lib/validators';
import { serializePath } from '../../lib/util';

export default new Hono().patch(
   '/',
   idParamValidator({
      pathId: z.coerce
         .number({ error: 'Path ID must be a number' })
         .int({ error: 'Path ID must be a whole number' })
         .positive({ error: 'Path ID must be greater than 0' })
   }),
   bodyValidator(
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
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['asset.delete'], c)) {
            return forbiddenError(c);
         }

         // Get information from request
         const { id, pathId } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id
            },
            include: {
               paths: {
                  where: {
                     id: pathId
                  },
                  select: {
                     name: true,
                     path: true
                  }
               },
               json: {
                  select: {
                     rawJson: true
                  }
               }
            }
         });

         // Check if the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         // Check that the path exists
         if (!asset.paths) {
            return notFoundError(c);
         }

         // Update the path in the database
         const updatedPath = await prisma.assetPath.update({
            where: {
               id: pathId
            },
            select: {
               id: true,
               name: true,
               path: true
            },
            data: {
               name: body.name ?? asset.paths[0].name,
               path: body.path ?? asset.paths[0].path
            }
         });

         return c.json(serializePath(updatedPath, asset.json[0]?.rawJson), 200);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
