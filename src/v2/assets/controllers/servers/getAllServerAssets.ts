import { Hono } from 'hono';

import { prisma } from '../../../../lib/prisma';
import { internalServerError } from '../../../../lib/errorMessages';
import { assetInclude, serializeAsset } from '../../lib/util';
import { paginationQueryValidator } from '../../../../lib/validators';
import server from 'hono/jsx/dom/server';

export default new Hono().get('/', paginationQueryValidator({}), async (c) => {
   try {
      // Get information from the request
      const { page, limit } = c.req.valid('query');

      // Get all the servers 
      const [servers, total] = await prisma.$transaction([
         prisma.asset.findMany({
            where: {
               server: {
                  isNot: null
               }
            },
            include: {
               ...assetInclude,
               server: {
                  select: {
                     model: true
                  }
               }
            }
         }),

         prisma.server.count()
      ]);

      return c.json(
         {
            servers: servers.map((server) => ({
               ...serializeAsset(
                  { ...server, jsonPosition: 0 },
                  {
                     model: server.server?.model
                  }
               )
            })),
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit)
         },
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
