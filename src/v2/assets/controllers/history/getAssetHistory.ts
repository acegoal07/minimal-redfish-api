import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { idParamValidator, queryValidator } from '../../../../lib/validators';

export default new Hono().get(
   '/',
   idParamValidator({
      jsonId: z.coerce
         .number({ error: 'Json ID must be a number' })
         .int({ error: 'Json ID must be a whole number' })
         .positive({ error: 'Json ID must be greater than 0' })
   }),
   async (c) => {
      try {
         // Get request information
         const { id, jsonId } = c.req.valid('param');

         const asset = await prisma.asset.findUnique({
            where: {
               id
            },
            include: {
               json: {
                  orderBy: {
                     uploadDate: 'desc'
                  }
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

         const jsonHistory = await prisma.assetJson.findFirst({
            where: {
               id: jsonId,
               assetId: id
            },
            select: {
               id: true
            }
         });

         if (!jsonHistory) {
            return notFoundError(c);
         }

         await prisma.assetJson.delete({
            where: {
               id: jsonId
            }
         });

         return c.json(204);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
