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
            .min(1, { message: 'Name cannot be empty' }),
         size: z
            .number({ error: 'Size must be a number' })
            .int({ message: 'Size must be a whole number' })
            .min(1, { message: 'Size must be greater than 0' }),
         notes: z.string({ error: 'Notes must be a string' }).trim().optional()
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
         if (!validatePermissions(['rack.read', 'rack.write'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const body = c.req.valid('json');

         // Try and get a rack with the same name
         const existingRack = await prisma.rack.findFirst({
            where: {
               name: body.name
            },
            select: {
               id: true
            }
         });

         // Check if a rack already exists
         if (existingRack) {
            return existingResourceError(c);
         }

         // Create the rack in the database
         const rack = await prisma.rack.create({
            data: {
               name: body.name,
               notes: body.notes,
               size: body.size
            }
         });

         return c.json(
            {
               id: rack.id,
               name: rack.name,
               notes: rack.notes,
               size: rack.size
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
