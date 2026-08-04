import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   forbiddenError,
   internalServerError,
   invalidBodyError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';

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
      z
         .array(
            z.object({
               name: z
                  .string({ error: 'Name must be a string' })
                  .trim()
                  .min(1, { message: 'Name cannot be empty' }),
               path: z
                  .string({ error: 'Path must be a string' })
                  .trim()
                  .min(1, { message: 'Path cannot be empty' })
            })
         )
         .min(1, {
            message: 'At least one path is required'
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

         // Add all the new paths to the template
         const newPaths = await prisma.$transaction(
            body.map((path) =>
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
