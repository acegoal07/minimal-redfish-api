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
         if (!validatePermissions(['tag.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const body = c.req.valid('json');

         // Try and get the tag from the database
         const existingTag = await prisma.tag.findUnique({
            where: {
               name: body.name
            },
            select: {
               id: true
            }
         });

         // Check if a tag exists
         if (existingTag) {
            return existingResourceError(c);
         }

         // Add the new tag to the database
         const newTag = await prisma.tag.create({
            data: {
               name: body.name
            },
            select: {
               id: true
            }
         });

         return c.json(
            {
               id: newTag.id,
               name: body.name
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
