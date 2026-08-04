import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   internalServerError,
   invalidBodyError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().post(
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
         name: z.string().trim().min(1),
         path: z.string().trim().min(1)
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

         // Add path to database
         const newPath = await prisma.templatePath.create({
            data: {
               templateId: id,
               name: body.name,
               path: body.path
            },
            select: {
               id: true
            }
         });

         return c.json(
            {
               id: newPath.id,
               name: body.name,
               path: body.path
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
