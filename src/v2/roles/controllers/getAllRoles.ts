import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
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

         // Get all the roles
         const [roles, total] = await prisma.$transaction([
            prisma.role.findMany({
               include: {
                  permissions: true
               },
               skip: (page - 1) * limit,
               take: limit
            }),

            prisma.role.count()
         ]);

         return c.json(
            {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
               roles: roles.map((role) => ({
                  id: role.id,
                  name: role.name,
                  permissions: role.permissions.map((name) => name)
               }))
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
