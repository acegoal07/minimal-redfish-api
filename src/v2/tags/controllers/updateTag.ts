import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   forbiddenError,
   internalServerError,
   invalidBodyError,
   notFoundError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';

export default new Hono().patch(
   '/',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'ID must be a number' })
            .int({ error: 'ID must be a whole number' })
            .positive({ error: 'ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   zValidator(
      'json',
      z.object({
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { error: 'Name cannot be empty' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['tag.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the tag from the database
         const existingTag = await prisma.tag.findUnique({
            where: {
               id
            },
            select: {
               name: true
            }
         });

         // Check if a tag exists
         if (!existingTag) {
            return notFoundError(c);
         }

         // Update the tag in the database
         const updatedTag = await prisma.tag.update({
            where: {
               id
            },
            data: {
               name: body.name ?? existingTag.name
            },
            select: {
               name: true
            }
         });

         return c.json(
            {
               id,
               name: updatedTag.name
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
