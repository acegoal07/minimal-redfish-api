import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getValueFromJson } from '../../../lib/util';

export default new Hono().get(
   '/',
   zValidator(
      'query',
      z
         .object({
            query: z.string().trim().optional()
         })
         .transform((value) => ({
            query: value.query,
            id: value.query ? Number(value.query) : undefined
         }))
   ),
   async (c) => {
      const { query, id } = c.req.valid('query');

      if (!query) {
         return c.json([], 200);
      }

      try {
         const assets = await prisma.asset.findMany({
            where: {
               OR: [
                  ...(Number.isInteger(id) ? [{ id }] : []),
                  {
                     name: {
                        contains: query,
                        mode: 'insensitive'
                     }
                  }
               ]
            },
            include: {
               jsonHistory: {
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
                     jsonHistory: true
                  }
               }
            }
         });

         return c.json(
            assets.map((asset) => ({
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
                     JSON.parse(asset.jsonHistory[0]?.rawJson),
                     path.path
                  )
               })),
               json: {
                  id: asset.jsonHistory[0]?.id,
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
