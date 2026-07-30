import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
   internalServerError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';
import { getValueFromJson } from '../../../lib/util';

export default new Hono().get(
   '/:id/assets',
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

         // Try and get the rack from the database
         const rack = await prisma.rack.findUnique({
            where: {
               id
            },
            include: {
               assets: {
                  include: {
                     jsonHistory: {
                        orderBy: {
                           uploadDate: 'desc'
                        },
                        take: 1
                     },
                     paths: true,
                     _count: {
                        select: {
                           jsonHistory: true
                        }
                     }
                  }
               }
            }
         });

         // Check if the rack exists
         if (!rack) {
            return notFoundError(c);
         }

         return c.json(
            rack.assets.map((asset) => ({
               id: asset.id,
               name: asset.name,
               position: asset.position,
               size: asset.size,
               rackId: asset.rackId,
               data: asset.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path,
                  value: getValueFromJson<string>(
                     JSON.parse(asset.jsonHistory[0].rawJson),
                     path.path
                  )
               })),
               json: {
                  text: asset.jsonHistory[0]?.rawJson,
                  filename: asset.jsonHistory[0]?.filename
               },
               pagination: {
                  position: 0,
                  total: asset._count.jsonHistory
               }
            })),
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
