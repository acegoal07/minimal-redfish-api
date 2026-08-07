import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   existingResourceError,
   forbiddenError,
   internalServerError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { bodyValidator } from '../../../lib/validators';

export default new Hono().post(
   '/',
   bodyValidator(
      z.object({
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { error: 'Name cannot be empty' }),
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
            .optional()
      })
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['template.read', 'template.write'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { name, paths } = c.req.valid('json');

         // Try and get a template with the name
         const existingTemplate =
            (await prisma.template.findUnique({
               where: {
                  name
               },
               select: {
                  id: true
               }
            })) !== null;

         // Check if a template exists
         if (existingTemplate) {
            return existingResourceError(c);
         }

         // Create the new template
         const newTemplate = await prisma.template.create({
            data: {
               name
            },
            select: {
               name: true,
               id: true
            }
         });

         // Add all the new paths to the template
         const addedPaths = await prisma.$transaction(
            (paths ?? []).map((path) =>
               prisma.templatePath.create({
                  data: {
                     name: path.name,
                     path: path.path,
                     templateId: newTemplate.id
                  }
               })
            )
         );

         return c.json(
            {
               id: newTemplate.id,
               name: newTemplate.name,
               paths: addedPaths.map((path) => ({
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
