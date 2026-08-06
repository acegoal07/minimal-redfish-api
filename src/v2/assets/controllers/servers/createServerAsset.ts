import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import {
   existingResourceError,
   forbiddenError,
   internalServerError,
   invalidBodyError
} from '../../../../lib/errorMessages';
import { getValueFromJson, validatePermissions } from '../../../../lib/util';

export default new Hono().post(
   '/',
   zValidator(
      'json',
      z.object({
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { error: 'Name cannot be empty' }),
         model: z.string({ error: 'Model must be a string' }).trim().optional(),
         paths: z
            .array(
               z.object({
                  name: z
                     .string({ error: 'Name must be a string' })
                     .trim()
                     .min(1, { error: 'Name cannot be empty' }),
                  path: z
                     .string({ error: 'Path must be a string' })
                     .trim()
                     .min(1, { error: 'Path cannot be empty' })
               })
            )
            .default([]),
         group: z
            .number({ error: 'Group ID must be a number' })
            .int({ error: 'Group ID must be an integer' })
            .positive({ error: 'Group ID must be greater than 0' })
            .optional(),
         tags: z
            .array(
               z
                  .number({ error: 'Tag ID must be a number' })
                  .int({ error: 'Tag ID must be an integer' })
                  .positive({ error: 'Tag ID must be greater than 0' })
            )
            .default([])
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['asset.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const body = c.req.valid('json');

         // Try and get the tag from the database
         const existingServer = await prisma.asset.findFirst({
            where: {
               name: body.name,
               server: {
                  isNot: null
               }
            },
            select: {
               id: true
            }
         });

         // Check if a tag exists
         if (existingServer) {
            return existingResourceError(c);
         }

         // Add the new server to the database
         const newServer = await prisma.asset.create({
            data: {
               name: body.name,
               groupId: body.group,
               tags: {
                  connect: body.tags.map((id) => ({ id }))
               },
               server: {
                  create: {
                     model: body.model
                  }
               },
               paths: {
                  createMany: {
                     data: body.paths
                  }
               }
            },
            include: {
               server: {
                  select: {
                     model: true
                  }
               },
               group: true,
               tags: true,
               paths: true,
               jsons: {
                  select: {
                     rawJson: true
                  }
               }
            }
         });

         return c.json(
            {
               id: newServer.id,
               name: newServer.name,
               model: newServer.server?.model,
               storage: {
                  id: newServer.storageId
               },
               group: {
                  id: newServer.group?.id,
                  name: newServer.group?.name
               },
               tags: newServer.tags.map((tag) => ({
                  id: tag.id,
                  navigation: tag.name
               })),
               paths: newServer.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path,
                  value: getValueFromJson(newServer.jsons[0].rawJson ?? {}, path.path)
               }))
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
