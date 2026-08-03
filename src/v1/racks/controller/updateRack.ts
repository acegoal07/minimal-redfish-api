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
      z
         .object({
            name: z.string({ error: 'Name must be a string' }).trim().optional(),
            size: z
               .number({ error: 'Size must be a number' })
               .min(1, { message: 'Size must be at least 1' })
               .optional(),
            notes: z.string({ error: 'Notes must be a string' }).trim().optional()
         })
         .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field must be provided'
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
         const rack = await prisma.rack.findUnique({
            where: {
               id
            },
            select: {
               name: true,
               size: true,
               notes: true
            }
         });

         // Check if the rack exists
         if (!rack) {
            return notFoundError(c);
         }

         // Update the rack in the database
         const updatedRack = await prisma.rack.update({
            data: {
               name: body.name ?? rack.name,
               size: body.size ?? rack.size,
               notes: body.notes ?? rack.notes
            },
            where: {
               id
            }
         });

         return c.json(
            {
               id: updatedRack.id,
               name: updatedRack.name,
               notes: updatedRack.notes,
               size: updatedRack.size
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
