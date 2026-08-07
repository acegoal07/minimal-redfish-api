import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { searchQueryValidator } from '../../../lib/validators';

export default new Hono().get('/', searchQueryValidator({}), async (c) => {
   try {
      // Get request information
      const { query, page, limit } = c.req.valid('query');

      // Returns blank if there is no query
      if (!query) {
         return c.json([], 200);
      }

      // Search for groups
      const [groups, total] = await prisma.$transaction([
         prisma.group.findMany({
            where: {
               OR: [
                  ...(Number.isInteger(Number(query)) ? [{ id: Number(query) }] : []),
                  {
                     name: {
                        contains: query
                     }
                  }
               ]
            },
            skip: (page - 1) * limit,
            take: limit
         }),

         prisma.group.count({
            where: {
               OR: [
                  ...(Number.isInteger(Number(query)) ? [{ id: Number(query) }] : []),
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
            groups: groups.map((group) => ({
               id: group.id,
               name: group.name
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
