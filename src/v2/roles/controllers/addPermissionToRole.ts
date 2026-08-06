import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   forbiddenError,
   internalServerError,
   invalidBodyError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';

export default new Hono().post(
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
   zValidator(
      'json',
      z.object({
         permissions: z
            .array(
               z
                  .number({ error: 'Permission ID must be a number' })
                  .int({ error: 'Permission ID must be an integer' })
                  .positive({ error: 'Permission ID must be greater than 0' }),
               { error: 'Permissions must be an array' }
            )
            .min(1, {
               error: 'At least one permission is required'
            })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['role.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');
         const { permissions } = c.req.valid('json');

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

         // Add the new permissions to the role
         const updatedRole = await prisma.role.update({
            where: {
               id
            },
            data: {
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
