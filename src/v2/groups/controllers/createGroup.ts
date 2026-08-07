import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   existingResourceError,
   forbiddenError,
   internalServerError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { bodyValidator } from '../../../lib/validators';

export default new Hono().post(
   '/',
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
         if (!validatePermissions(['group.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const body = c.req.valid('json');

         // Try and get the group from the database
         const existingGroup =
            (await prisma.group.findUnique({
               where: {
                  name: body.name
               },
               select: {
                  id: true
               }
            })) !== null;

         // Check if a group exists
         if (existingGroup) {
            return existingResourceError(c);
         }

         // Add the new group to the database
         const newGroup = await prisma.group.create({
            data: {
               name: body.name
            },
            select: {
               id: true
            }
         });

         return c.json(
            {
               id: newGroup.id,
               name: body.name
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
