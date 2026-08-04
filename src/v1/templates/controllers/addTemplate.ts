import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   existingResourceError,
   forbiddenError,
   internalServerError,
   invalidBodyError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';

export default new Hono().post(
   '/',
   zValidator(
      'json',
      z.object({
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { message: 'Name cannot be empty' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['template.read', 'template.write'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { name } = c.req.valid('json');

         // Try and get a template with the name
         const existingTemplate = await prisma.template.findUnique({
            where: {
               name
            }
         });

         // Check if a template exists
         if (existingTemplate) {
            return existingResourceError(c);
         }

         // Create the new template
         const template = await prisma.template.create({
            data: {
               name
            },
            include: {
               paths: true
            }
         });

         return c.json(
            {
               id: template.id,
               name: template.id,
               paths: template.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path
               }))
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
