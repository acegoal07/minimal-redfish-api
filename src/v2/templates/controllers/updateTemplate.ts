import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { bodyValidator, idParamValidator } from '../../../lib/validators';

export default new Hono().patch(
   '/',
   idParamValidator({}),
   bodyValidator(
      z.object({
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { error: 'Name cannot be empty' })
      })
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['template.read', 'template.write'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the rack from the database
         const existingTemplate = await prisma.template.findUnique({
            where: {
               id
            },
            select: {
               name: true
            }
         });

         // Check if the rack exists
         if (!existingTemplate) {
            return notFoundError(c);
         }

         // Update the template in the database
         const updatedTemplate = await prisma.template.update({
            where: {
               id
            },
            data: {
               name: body.name ?? existingTemplate.name
            },
            include: {
               paths: true
            }
         });

         return c.json(
            {
               id: updatedTemplate.id,
               name: updatedTemplate.name,
               paths: updatedTemplate.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path
               }))
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
