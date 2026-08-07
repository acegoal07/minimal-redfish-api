import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { paginationQueryValidator } from '../../../lib/validators';

export default new Hono().get('/', paginationQueryValidator({}), async (c) => {
   try {
      // Get request information
      const { page, limit } = c.req.valid('query');

      // Get all the tags
      const [tags, total] = await prisma.$transaction([
         prisma.tag.findMany({
            skip: (page - 1) * limit,
            take: limit
         }),

         prisma.tag.count()
      ]);

      return c.json(
         {
            tags: tags.map((tag) => ({
               id: tag.id,
               name: tag.name
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
