import { Hono } from 'hono';

import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson, validatePermissions } from '../../../lib/util';
import {
   forbiddenError,
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
         // Check users permissions
         if (!validatePermissions(['rack.read'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { id } = c.req.valid('param');

         // Try and get the rack from the database
         const rack = await prisma.rack.findUnique({
            where: {
               id
            },
            include: {
               assets: {
                  include: {
                     json: {
                        orderBy: {
                           uploadDate: 'desc'
                        },
                        select: {
                           id: true,
                           filename: true,
                           rawJson: true
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
                     _count: {
                        select: {
                           json: true
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
                  value: getValueFromJson<string>(JSON.parse(asset.json[0]?.rawJson), path.path)
               })),
               json: {
                  id: asset.json[0]?.id,
                  text: asset.json[0]?.rawJson,
                  filename: asset.json[0]?.filename
               },
               pagination: {
                  position: 0,
                  total: asset._count.json
               }
            })),
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
