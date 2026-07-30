import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { internalServerError, invalidBodyError } from '../../../lib/errorMessages';

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
         const body = c.req.valid('json');

         // Create the rack in the database
         const rack = await prisma.rack.create({
            data: body
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
