import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   internalServerError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().get(
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
            return invalidParametersError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Get request information
         const { id } = c.req.valid('param');

         // Get the role from the database
         const role = await prisma.role.findUnique({
            where: {
               id
            },
            include: {
               permissions: true
            }
         });

         // Check if the role exists
         if (!role) {
            return notFoundError(c);
         }

         return c.json(
            {
               id: role.id,
               name: role.name,
               permissions: role.permissions.map((name) => name)
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
