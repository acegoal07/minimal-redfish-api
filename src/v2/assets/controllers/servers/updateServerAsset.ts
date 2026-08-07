import { Hono } from 'hono';

import { prisma } from '../../../../lib/prisma';
import { internalServerError, notFoundError } from '../../../../lib/errorMessages';
import { assetInclude, serializeAsset } from '../../lib/util';
import { bodyValidator, idParamValidator } from '../../../../lib/validators';
import { z } from 'zod';

export default new Hono().patch(
   '/',
   idParamValidator({}),
   bodyValidator(
      z
         .object({
            name: z.string({ error: 'Name must be a string' }).trim().optional(),
            notes: z.string({ error: 'Notes must be a string' }).trim().optional(),
            position: z
               .number({ error: 'Position must be a number' })
               .int({ error: 'Position must be an integer' })
               .nonnegative({ error: "Position can't be less than zero" })
               .optional(),
            storageId: z
               .number({ error: 'Storage ID must be a number' })
               .int({ error: 'Storage ID must be an integer' })
               .positive({ error: 'Storage ID must be greater than 0' })
               .optional(),
            groupId: z
               .number({ error: 'Group ID must be a number' })
               .int({ error: 'Group ID must be an integer' })
               .positive({ error: 'Group ID must be greater than 0' })
               .optional(),
            model: z.string({ error: 'Model must be a string' }).trim().optional()
         })
         .refine((data) => Object.keys(data).length > 0, {
            error: 'At least one field must be provided'
         })
   ),
   async (c) => {
      try {
         // Get request information
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the server from the asset from
         const existingServer = await prisma.asset.findUnique({
            where: {
               id,
               server: {
                  isNot: null
               }
            },
            include: {
               ...assetInclude,
               server: true
            }
         });

         // Check if the server exists
         if (!existingServer) {
            return notFoundError(c);
         }

         if (body.storageId) {
            // Try and get the new storage from the database
            const existingStorage = await prisma.storage.findUnique({
               where: {
                  id: body.storageId
               }
            });

            // Check if the storage exists
            if (!existingStorage) {
               return notFoundError(c);
            }
         }

         // Update the server in the database
         const updatedServer = await prisma.asset.update({
            where: {
               id
            },
            data: {
               name: body.name ?? existingServer.name,
               notes: body.notes ?? existingServer.notes,
               storageId: body.storageId ?? existingServer.storageId,
               position: body.position ?? existingServer.position,
               groupId: body.groupId ?? existingServer.groupId,
               server: {
                  update: {
                     model: body.model ?? existingServer.server?.model
                  }
               }
            },
            include: {
               ...assetInclude,
               storage: {
                  include: {
                     asset: {
                        select: {
                           name: true
                        }
                     }
                  }
               }
            }
         });

         return c.json(serializeAsset({ ...updatedServer, jsonPosition: 0 }), 200);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
