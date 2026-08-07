import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { queryValidator } from '../../../lib/validators';

export default new Hono().get(
   '/',
   queryValidator(
      z
         .object({
            query: z.string({ error: 'Query must be a string' }).trim().optional(),
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
         .transform((value) => ({
            query: value.query,
            id: value.query ? Number(value.query) : undefined,
            page: value.page,
            limit: value.limit
         }))
   ),
   async (c) => {
      try {
         // Get request information
         const { query, id, page, limit } = c.req.valid('query');

         // Returns blank if there is no query
         if (!query) {
            return c.json([], 200);
         }

         // Search for roles
         const [roles, total] = await prisma.$transaction([
            prisma.role.findMany({
               where: {
                  OR: [
                     ...(Number.isInteger(id) ? [{ id }] : []),
                     {
                        name: {
                           contains: query
                        }
                     }
                  ]
               },
               include: {
                  permissions: true
               },
               skip: (page - 1) * limit,
               take: limit
            }),

            prisma.role.count({
               where: {
                  OR: [
                     ...(Number.isInteger(id) ? [{ id }] : []),
                     {
                        name: {
                           contains: query
                        }
                     }
                  ]
               }
            })
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
