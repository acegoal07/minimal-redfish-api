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
         // Check user permissions
         if (!validatePermissions(['group.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the group from the database
         const existingGroup = await prisma.group.findUnique({
            where: {
               id
            },
            select: {
               name: true
            }
         });

         // Check if a group exists
         if (!existingGroup) {
            return notFoundError(c);
         }

         // Update the group in the database
         const updatedGroup = await prisma.group.update({
            where: {
               id
            },
            data: {
               name: body.name ?? existingGroup.name
            },
            select: {
               name: true
            }
         });

         return c.json(
            {
               id,
               name: updatedGroup.name
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
