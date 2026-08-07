import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { paginationQueryValidator } from '../../../lib/validators';

export default new Hono().get('/', paginationQueryValidator({}), async (c) => {
   try {
      // Check users permissions
      if (!validatePermissions(['template.read'], c)) {
         return forbiddenError(c);
      }

      // Get information from the request
      const { page, limit } = c.req.valid('query');

      // Get all the templates
      const [templates, total] = await prisma.$transaction([
         prisma.template.findMany({
            skip: (page - 1) * limit,
            take: limit,
            include: {
               paths: true
            }
         }),

         prisma.template.count()
      ]);

      return c.json(
         {
            templates: templates.map((template) => ({
               id: template.id,
               name: template.name,
               paths: template.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path
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
