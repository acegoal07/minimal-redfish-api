import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError } from '../../../lib/errorMessages';
import { getValueFromJson, validatePermissions } from '../../../lib/util';

export default new Hono().get(
   '/',
   zValidator(
      'query',
      z
         .object({
            query: z.string({ error: 'Query must be a string' }).trim().optional(),
            page: z.coerce
               .number({ error: 'Page must be a number' })
               .int({ error: 'Page must be an integer' })
               .nonnegative({ error: 'Page must be 0 or greater' })
               .default(0),
            limit: z.coerce
               .number({ error: 'Limit must be a number' })
               .int({ error: 'Limit must be an integer' })
               .positive({ error: 'Limit must be greater than 0' })
               .default(25)
         })
         .transform((value) => ({
            query: value.query,
            id: value.query ? Number(value.query) : undefined,
            page: value.page,
            limit: value.limit
         }))
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['asset.read'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { query, id, page, limit } = c.req.valid('query');

         // Returns blank if there is no query
         if (!query) {
            return c.json([], 200);
         }

         // Search for assets
         const [assets, total] = await prisma.$transaction([
            prisma.asset.findMany({
               where: {
                  OR: [
                     ...(Number.isInteger(id) ? [{ id }] : []),
                     {
                        name: {
                           contains: query
                        }
                     }
                  ]
               },
               include: {
                  json: {
                     orderBy: {
                        uploadDate: 'desc'
                     },
                     select: {
                        rawJson: true,
                        id: true,
                        filename: true
                     },
                     take: 1
                  },
                  paths: true,
                  _count: {
                     select: {
                        json: true
                     }
                  }
               },
               skip: page * limit,
               take: limit
            }),

            prisma.asset.count({
               where: {
                  OR: [
                     ...(Number.isInteger(id) ? [{ id }] : []),
                     {
                        name: {
                           contains: query
                        }
                     }
                  ]
               }
            })
         ]);

         return c.json(
            {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
               assets: assets.map((asset) => ({
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
                     filename: asset.json[0]?.filename,
                     position: 0,
                     total: asset._count.json
                  }
               }))
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
