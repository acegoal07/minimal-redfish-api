import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson } from '../../../lib/util';
import { internalServerError, notFoundError } from '../../../lib/errorMessages';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().get(
   '/',
   idParamValidator({
      offset: z.coerce.number({ error: 'Offset must be a number' }).optional().default(0)
   }),
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
               json: {
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
                  position: offset,
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
