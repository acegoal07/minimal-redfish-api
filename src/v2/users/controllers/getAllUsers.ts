import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { paginationQueryValidator } from '../../../lib/validators';

export default new Hono().get('/', paginationQueryValidator({}), async (c) => {
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
});
