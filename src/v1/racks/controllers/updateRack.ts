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
            return invalidParametersError(c, result);
         }
      }
   ),
   zValidator(
      'json',
      z
         .object({
            name: z.string({ error: 'Name must be a string' }).trim().optional(),
            size: z
               .number({ error: 'Size must be a number' })
               .min(1, { error: 'Size must be at least 1' })
               .int({ error: 'Size must be a whole number' })
               .optional(),
            notes: z.string({ error: 'Notes must be a string' }).trim().optional()
         })
         .refine((data) => Object.keys(data).length > 0, {
            error: 'At least one field must be provided'
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
         if (!validatePermissions(['asset.update'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the rack from the database
         const rack = await prisma.asset.findFirst({
            where: {
               id,
               storage: {
                  isNot: null
               }
            },
            include: {
               storage: true
            }
         });

         // Check if the rack exists
         if (!rack) {
            return notFoundError(c);
         }

         // Update the rack in the database
         const updatedRack = await prisma.asset.update({
            where: {
               id
            },
            data: {
               name: body.name ?? rack.name,
               notes: body.notes ?? rack.notes,
               storage: {
                  update: {
                     size: body.size ?? rack.storage?.size
                  }
               }
            },
            include: {
               storage: true
            }
         });

         return c.json(
            {
               id: updatedRack.id,
               name: updatedRack.name,
               notes: updatedRack.notes,
               size: updatedRack.storage?.size
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
