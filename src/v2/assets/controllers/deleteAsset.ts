import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   forbiddenError,


   internalServerError,
   invalidBodyError,
   notFoundError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';

export default new Hono().delete(
   '/',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'ID must be a number' })
            .int({ error: 'ID must be a whole number' })
            .positive({ error: 'ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['asset.delete'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');

         // Try and get the asset from the database
         const existingAsset = await prisma.asset.findUnique({
            where: {
               id
            },
            select: {
               id: true
            }
         });

         // Check if the asset exists
         if (!existingAsset) {
            return notFoundError(c);
         }

         // Delete the asset the database
         await prisma.asset.delete({
            where: {
               id
            }
         });

         return c.json(204);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
