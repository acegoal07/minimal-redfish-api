import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { queryValidator } from '../../../lib/validators';

export default new Hono().get(
   '/',
   queryValidator(
      z
         .object({
            query: z.string().trim().optional()
         })
         .transform((value) => ({
            query: value.query,
            id: value.query ? Number(value.query) : undefined
         }))
   ),
   async (c) => {
      // Check users permissions
      if (!validatePermissions(['template.read'], c)) {
         return forbiddenError(c);
      }

      // Get request information
      const { query, id } = c.req.valid('query');

      // Returns blank if there is no query
      if (!query) {
         return c.json([], 200);
      }

      // Search for templates
      try {
         const templates = await prisma.template.findMany({
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
               paths: true
            }
         });

         return c.json(
            templates.map((template) => ({
               id: template.id,
               name: template.name,
               paths: template.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.name
               }))
            })),
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
