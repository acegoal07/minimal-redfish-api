import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../../lib/errorMessages';
import {
   idParamValidator,
   paginationQueryValidator,
   queryValidator
} from '../../../../lib/validators';

export default new Hono().get(
   '/',
   idParamValidator({}),
   paginationQueryValidator({}),
   async (c) => {
      try {
         // Get request information
         const { id } = c.req.valid('param');

         const { page, limit } = c.req.valid('query');

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

         const [jsons, total] = await prisma.$transaction([
            prisma.assetJson.findMany({
               where: {
                  assetId: id
               },
               select: {
                  id: true,
                  rawJson: true
               }
            }),

            prisma.server.count()
         ]);
         return c.json(
            {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
               history: jsons.map((json) => ({
                  id: json.id,
                  rawJson: json.rawJson
               }))
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
