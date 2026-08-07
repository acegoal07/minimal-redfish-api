import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError, notFoundError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { bodyValidator, idParamValidator } from '../../../lib/validators';

export default new Hono().post(
   '/',
   idParamValidator({}),
   bodyValidator(
      z.object({
         paths: z
            .array(
               z.object({
                  name: z
                     .string({ error: 'Name must be a string' })
                     .trim()
                     .min(1, { error: 'Name cannot be empty' }),
                  path: z
                     .string({ error: 'Path must be a string' })
                     .trim()
                     .min(1, { error: 'Path cannot be empty' })
               })
            )
            .min(1, {
               error: 'At least one path is required'
            })
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
         const existingTemplate =
            (await prisma.template.findUnique({
               where: {
                  id
               },
               select: {
                  id: true
               }
            })) !== null;

         // Check if the rack exists
         if (!existingTemplate) {
            return notFoundError(c);
         }

         // Add all the new paths to the template
         const newPaths = await prisma.$transaction(
            body.paths.map((path) =>
               prisma.templatePath.create({
                  data: {
                     name: path.name,
                     path: path.path,
                     templateId: id
                  }
               })
            )
         );

         return c.json(
            newPaths.map((path) => ({
               id: path.name,
               name: path.name,
               path: path.path
            })),
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
