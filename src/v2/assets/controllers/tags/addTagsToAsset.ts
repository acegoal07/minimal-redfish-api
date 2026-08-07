import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { validatePermissions } from '../../../../lib/util';
import { bodyValidator, idParamValidator } from '../../../../lib/validators';
import { assetInclude, serializeAsset } from '../../lib/util';

export default new Hono().post(
   '/',
   idParamValidator({}),
   bodyValidator(
      z.object({
         tags: z
            .array(
               z
                  .number({ error: 'Tag ID must be a number' })
                  .int({ error: 'Tag ID must be an integer' })
                  .positive({ error: 'Tag ID must be greater than 0' }),
               { error: 'tags must be an array' }
            )
            .min(1, {
               error: 'At least one tag is required'
            })
      })
   ),
   async (c) => {
      try {
         if (!validatePermissions(['asset.update'], c)) {
            return forbiddenError(c);
         }

         const { id } = c.req.valid('param');
         const { tags } = c.req.valid('json');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: { id }
         });

         if (!asset) {
            return notFoundError(c);
         }

         const updatedAsset = await prisma.asset.update({
            where: {
               id
            },
            data: {
               tags: {
                  connect: tags.map((id) => ({ id }))
               }
            },
            include: {
               ...assetInclude,
               storage: {
                  include: {
                     asset: {
                        select: {
                           name: true
                        }
                     }
                  }
               }
            }
         });

         return c.json(serializeAsset({ ...updatedAsset, jsonPosition: 0 }), 200);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
