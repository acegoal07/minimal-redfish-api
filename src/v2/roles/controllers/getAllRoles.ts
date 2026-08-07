import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { paginationQueryValidator } from '../../../lib/validators';

export default new Hono().get('/', paginationQueryValidator({}), async (c) => {
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
            roles: roles.map((role) => ({
               id: role.id,
               name: role.name,
               permissions: role.permissions.map((name) => name)
            })),
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
         },
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
