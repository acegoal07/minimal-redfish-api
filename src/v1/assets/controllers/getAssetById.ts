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
            .positive({ error: 'ID must be greater than 0' })
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
         const { id } = c.req.valid('param');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id,
               server: {
                  isNot: null
               }
            },
            include: {
               server: true,
               json: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  take: 1
               },
               paths: true,
               _count: {
                  select: {
                     json: true
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
                  value: getValueFromJson<string>(JSON.parse(asset.json[0]?.rawJson), path.path)
               })),
               json: {
                  id: asset.json[0]?.id,
                  text: asset.json[0]?.rawJson,
                  position: 0,
                  total: asset._count.json
               }
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
