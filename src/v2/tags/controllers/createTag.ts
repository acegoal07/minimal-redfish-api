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
            .min(1, { error: 'Name cannot be empty' })
      })
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
         const existingTag =
            (await prisma.tag.findUnique({
               where: {
                  name: body.name
               },
               select: {
                  id: true
               }
            })) !== null;

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
