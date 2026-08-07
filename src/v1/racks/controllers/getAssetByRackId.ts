import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson } from '../../../lib/util';
import { internalServerError, notFoundError } from '../../../lib/errorMessages';
import { idParamValidator } from '../../../lib/validators';

export default new Hono().get('/', idParamValidator({}), async (c) => {
   try {
      // Get request information
      const { id } = c.req.valid('param');

      // Try and get the rack from the database
      const rack = await prisma.asset.findMany({
         where: {
            storageId: id,
            storageType: {
               isNot: null
            }
         },
         include: {
            json: {
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
            storageType: true,
            _count: {
               select: {
                  json: true
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
            size: asset.storageType?.size,
            rackId: asset.storageId,
            data: asset.paths.map((path) => ({
               id: path.id,
               name: path.name,
               path: path.path,
               value: getValueFromJson<string>(JSON.parse(asset.json[0]?.rawJson), path.path)
            })),
            json: {
               id: asset.json[0]?.id,
               text: asset.json[0]?.rawJson
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
});
