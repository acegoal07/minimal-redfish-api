import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
   internalServerError,
   invalidBodyError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().patch(
   '/',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'ID must be a number' })
            .int({ message: 'ID must be a whole number' })
            .positive({ message: 'ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidParametersError(c, result);
         }
      }
   ),
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
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the rack from the database
         const template = await prisma.template.findUnique({
            where: {
               id
            },
            select: {
               id: true
            }
         });

         // Check if the rack exists
         if (!template) {
            return notFoundError(c);
         }

         // Update the template in the database
         const updatedTemplate = await prisma.template.update({
            where: {
               id
            },
            data: {
               name: body.name
            },
            include: {
               templatePaths: true
            }
         });

         return c.json(
            {
               id: updatedTemplate.id,
               name: updatedTemplate.name,
               paths: updatedTemplate.templatePaths.map((path) => ({
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
