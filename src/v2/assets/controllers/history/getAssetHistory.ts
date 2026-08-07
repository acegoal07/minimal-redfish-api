import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { idParamValidator, queryValidator } from '../../../../lib/validators';

export default new Hono().get(
   '/',
   idParamValidator({}),
   queryValidator(
      z.object({
         page: z.coerce
            .number({ error: 'Page must be a number' })
            .int({ error: 'Page must be an integer' })
            .positive({ error: 'Page must be 1 or greater' })
            .default(1),
         limit: z.coerce
            .number({ error: 'Limit must be a number' })
            .int({ error: 'Limit must be an integer' })
            .positive({ error: 'Limit must be greater than 0' })
            .default(25)
      })
   ),
   async (c) => {
      try {
         // Get request information
         const { id } = c.req.valid('param');
         const { page, limit } = c.req.valid('query');

         const asset = await prisma.asset.findUnique({
            where: {
               id,
               server: {
                  isNot: null
               }
            },
            include: {
               json: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  skip: (page - 1) * limit,
                  take: limit
               },
               _count: {
                  select: {
                     json: true
                  }
               }
            }
         });

         if (!asset) {
            return notFoundError(c);
         }

         return c.json(
            {
               data: asset.json.map((json) => ({
                  id: json.id,
                  text: json.rawJson
               })),
               page,
               limit,
               total: asset._count.json,
               totalPages: Math.ceil(asset._count.json / limit)
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
