import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   forbiddenError,
   internalServerError,
   invalidParametersError,
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
            .int({ message: 'ID must be a whole number' })
            .positive({ message: 'ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidParametersError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         const { id } = c.req.valid('param');
         const auth = c.get('user');

         // Try and get the user from the database
         const user = await prisma.user.findUnique({
            where: {
               id
            },
            select: {
               id: true,
               username: true
            }
         });

         // Check if the user exists
         if (!user) {
            return notFoundError(c);
         }

         // Deny user if their token doesn't match the user that's being deleted
         if (user.id != auth.id && !validatePermissions(['user.delete'], c)) {
            return forbiddenError(c);
         }

         // Delete the template from the database
         await prisma.user.delete({
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
