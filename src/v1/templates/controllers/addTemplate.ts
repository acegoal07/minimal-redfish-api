import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import {
   existingResourceError,
   internalServerError,
   invalidBodyError
} from '../../../lib/errorMessages';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export default new Hono().post(
   '/',
   zValidator(
      'json',
      z.object({
         name: z.string().trim().min(1)
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
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
               templatePaths: true
            }
         });

         return c.json(
            {
               id: template.id,
               name: template.id,
               paths: template.templatePaths.map((path) => ({
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
