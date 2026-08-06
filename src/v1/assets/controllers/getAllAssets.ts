import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson } from '../../../lib/util';
import { internalServerError } from '../../../lib/errorMessages';

export default new Hono().get(
   '/',
   zValidator(
      'query',
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
         const { page, limit } = c.req.valid('query');

         // Search for assets
         const [assets, total] = await prisma.$transaction([
            prisma.asset.findMany({
               where: {
                  server: {
                     isNot: null
                  }
               },
               include: {
                  jsons: {
                     orderBy: {
                        uploadDate: 'desc'
                     },
                     take: 1
                  },
                  paths: true,
                  server: true,
                  _count: {
                     select: {
                        jsons: true
                     }
                  }
               },
               skip: (page - 1) * limit,
               take: limit
            }),

            prisma.asset.count({
               where: {
                  server: {
                     isNot: null
                  }
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
                     position: 0,
                     total: asset._count.jsons
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
