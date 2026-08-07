import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { queryValidator } from '../../../lib/validators';

export default new Hono().get(
   '/',
   queryValidator(
      z.object({
         page: z.coerce
            .number({ error: 'Page must be a number' })
            .int({ error: 'Page must be an integer' })
            .positive({ error: 'Page must be 1 or greater' })
            .default(1),
         limit: z.coerce
            .number({ error: 'Limit must be a number' })
            .int({ error: 'Limit must be an integer' })
            .positive({ error: 'Limit must be greater than 0' })
            .default(25)
      })
   ),
   async (c) => {
      try {
         // Get request information
         const { page, limit } = c.req.valid('query');

         // Get all the users
         const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
               include: {
                  role: {
                     include: {
                        permissions: true
                     }
                  }
               },
               skip: (page - 1) * limit,
               take: limit
            }),

            prisma.user.count()
         ]);

         return c.json(
            {
               users: users.map((user) => ({
                  id: user.id,
                  roleId: user.roleId,
                  username: user.username,
                  permissions: user.role.permissions.map((permission) => ({
                     id: permission.id,
                     name: permission.name
                  }))
               })),
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit)
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
