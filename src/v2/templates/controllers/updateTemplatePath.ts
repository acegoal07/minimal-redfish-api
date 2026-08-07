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
import { bodyValidator, idParamValidator } from '../../../lib/validators';

export default new Hono().patch(
   '/',
   idParamValidator({
      pathId: z.coerce
         .number({ error: 'Path ID must be a number' })
         .int({ error: 'Path ID must be a whole number' })
         .positive({ error: 'Path ID must be greater than 0' })
   }),
   bodyValidator(
      z
         .object({
            name: z.string({ error: 'Name must be a string' }).trim().optional(),
            path: z.string({ error: 'Path must be a string' }).trim().optional()
         })
         .refine((data) => Object.keys(data).length > 0, {
            error: 'At least one field must be provided'
         })
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['template.read', 'template.write'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id, pathId } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the path from the database
         const existingPath = await prisma.templatePath.findUnique({
            where: {
               id: pathId,
               templateId: id
            },
            select: {
               name: true,
               path: true
            }
         });

         // Check if the rack exists
         if (!existingPath) {
            return notFoundError(c);
         }

         // Update path in the database
         const updatedPath = await prisma.templatePath.update({
            data: {
               name: body.name ?? existingPath.name,
               path: body.path ?? existingPath.path
            },
            where: {
               id: pathId,
               templateId: id
            },
            select: {
               name: true,
               path: true
            }
         });

         return c.json(
            {
               id: pathId,
               name: updatedPath.name,
               path: updatedPath.path
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
