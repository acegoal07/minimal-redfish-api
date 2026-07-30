import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { getValueFromJson } from '../../../lib/util';
import { internalServerError } from '../../../lib/errorMessages';

export default new Hono().get('/', async (c) => {
   try {
      const assets = await prisma.asset.findMany({
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
               value: getValueFromJson<string>(JSON.parse(asset.jsonHistory[0].rawJson), path.path)
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
});
