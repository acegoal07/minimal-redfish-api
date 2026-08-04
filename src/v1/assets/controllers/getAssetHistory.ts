import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import {
   internalServerError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().get(
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
   async (c) => {
      try {
         const { id } = c.req.valid('param');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id
            },
            include: {
               jsonHistory: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  select: {
                     id: true,
                     rawJson: true,
                     filename: true
                  }
               }
            }
         });

         // Check to make sure the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         return c.json(
            asset.jsonHistory.map((json) => ({
               id: json.id,
               text: json.rawJson,
               filename: json.filename
            })),
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
