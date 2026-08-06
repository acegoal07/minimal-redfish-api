import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson } from '../../../lib/util';
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
            .int({ error: 'ID must be a whole number' })
            .positive({ error: 'ID must be greater than 0' }),
         offset: z.coerce.number({ error: 'Offset must be a number' }).optional().default(0)
      }),
      (result, c) => {
         if (!result.success) {
            return invalidParametersError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Get request information
         const { id, offset } = c.req.valid('param');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id,
               server: {
                  isNot: null
               }
            },
            include: {
               jsons: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  take: 1,
                  skip: offset
               },
               server: true,
               paths: true,
               _count: {
                  select: {
                     jsons: true
                  }
               }
            }
         });

         // Check to make sure the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         return c.json(
            {
               id: asset.id,
               name: asset.name,
               position: asset.position,
               size: asset.server?.size,
               rackId: asset.storageId,
               data: asset.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path,
                  value: getValueFromJson<string>(JSON.parse(asset.jsons[0]?.rawJson), path.path)
               })),
               json: {
                  id: asset.jsons[0]?.id,
                  text: asset.jsons[0]?.rawJson,
                  position: offset,
                  total: asset._count.jsons
               }
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
