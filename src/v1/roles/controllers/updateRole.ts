import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { bodyValidator, idParamValidator } from '../../../lib/validators';

export default new Hono().patch(
   '/',
   idParamValidator({}),
   bodyValidator(
      z.object({
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { error: 'Name cannot be empty' })
      })
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['role.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // try and get the role from the database
         const role = await prisma.role.findUnique({
            where: {
               id
            },
            select: {
               id: true
            }
         });

         // Check if the role exists
         if (!role) {
            return notFoundError(c);
         }

         // Update the role in the database
         const updatedRole = await prisma.role.update({
            where: {
               id
            },
            data: {
               name: body.name
            },
            include: {
               permissions: true
            }
         });

         return c.json(
            {
               id: updatedRole.id,
               name: updatedRole.name,
               permissions: updatedRole.permissions.map((name) => name)
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
