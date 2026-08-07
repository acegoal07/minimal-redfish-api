import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   forbiddenError,
   internalServerError,
   notFoundError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { bodyValidator, idParamValidator } from '../../../lib/validators';

export default new Hono().patch(
   '/',
   idParamValidator({}),
   bodyValidator(
      z
         .object({
            roleId: z.coerce
               .number({ error: 'Role ID must be a number' })
               .int({ error: 'Role ID must be a whole number' })
               .positive({ error: 'Role ID must be greater than 0' })
         })
         .refine((data) => Object.keys(data).length > 0, {
            error: 'At least one field must be provided'
         })
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['user.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the user from the database
         const existingUser = await prisma.user.findUnique({
            where: {
               id
            },
            select: {
               id: true
            }
         });

         // Check if a user already exists
         if (!existingUser) {
            return notFoundError(c);
         }

         // Try and get the role from the database
         const role = await prisma.role.findUnique({
            where: {
               id: body.roleId
            },
            select: {
               id: true
            }
         });

         // Check if role exists
         if (!role) {
            return notFoundError(c);
         }

         // Update the user in the database
         await prisma.user.update({
            where: {
               id
            },
            data: {
               roleId: body.roleId
            },
            select: {
               id: true
            }
         });

         return c.json(204);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
