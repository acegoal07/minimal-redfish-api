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
         size: z
            .number({ error: 'Size must be a number' })
            .int({ error: 'Size must be a whole number' })
            .min(1, { error: 'Size must be greater than 0' }),
         notes: z.string({ error: 'Notes must be a string' }).trim().optional()
      })
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['asset.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const body = c.req.valid('json');

         // Try and get a rack with the same name
         const existingRack = await prisma.asset.findFirst({
            where: {
               name: body.name,
               storage: {
                  isNot: null
               }
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
         const rack = await prisma.asset.create({
            data: {
               name: body.name,
               notes: body.notes,
               storageType: {
                  create: {
                     size: body.size
                  }
               }
            },
            include: {
               storageType: {
                  select: {
                     size: true
                  }
               }
            }
         });

         return c.json(
            {
               id: rack.id,
               name: rack.name,
               notes: rack.notes,
               size: rack.storageType?.size
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
