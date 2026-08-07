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
         if (!validatePermissions(['tag.delete'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');

         // Try and get the tag from the database
         const existingTag =
            (await prisma.tag.findUnique({
               where: {
                  id
               },
               select: {
                  id: true
               }
            })) !== null;

         // Check if the tag exists
         if (!existingTag) {
            return notFoundError(c);
         }

         // Delete the group the database
         await prisma.tag.delete({
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
