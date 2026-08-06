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

         // Try and get the rack from the database
         const rack = await prisma.asset.findMany({
            where: {
               storageId: id
            },
            include: {
               jsons: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  take: 1
               },
               paths: {
                  select: {
                     id: true,
                     name: true,
                     path: true
                  }
               },
               storage: true,
               _count: {
                  select: {
                     jsons: true
                  }
               }
            }
         });

         // Check if the rack exists
         if (!rack) {
            return notFoundError(c);
         }

         return c.json(
            rack.map((asset) => ({
               id: asset.id,
               name: asset.name,
               position: asset.position,
               size: asset.storage?.size,
               rackId: asset.storageId,
               data: asset.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path,
                  value: getValueFromJson<string>(JSON.parse(asset.jsons[0]?.rawJson), path.path)
               })),
               json: {
                  id: asset.jsons[0]?.id,
                  text: asset.jsons[0]?.rawJson
               },
               pagination: {
                  position: 0,
                  total: asset._count.jsons
               }
            })),
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
