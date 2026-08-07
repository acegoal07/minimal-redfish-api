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
            .string({ error: 'Username must be a string' })
            .trim()
            .min(1, { error: 'Username cannot be empty' }),
         permissions: z
            .array(
               z
                  .number({ error: 'Permission ID must be a number' })
                  .int({ error: 'Permission ID must be an integer' })
                  .positive({ error: 'Permission ID must be greater than 0' }),
               { error: 'Permissions must be an array' }
            )
            .default([])
      })
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['role.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { name, permissions } = c.req.valid('json');

         // Try and get a role from the database with the same name
         const existingRole = await prisma.role.findUnique({
            where: {
               name
            },
            select: {
               id: true
            }
         });

         // Check if a role exists
         if (existingRole) {
            return existingResourceError(c);
         }

         // Add the role to the database
         const newRole = await prisma.role.create({
            data: {
               name,
               permissions: {
                  connect: permissions.map((id) => ({ id }))
               }
            },
            include: {
               permissions: {
                  select: {
                     name: true
                  }
               }
            }
         });

         return c.json(
            {
               id: newRole.id,
               name: newRole.name,
               permissions: newRole.permissions.map((name) => name)
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
