import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson, isValidJson, validatePermissions } from '../../../lib/util';
import {
   internalServerError,
   invalidBodyError,
   notFoundError,
   invalidJsonError,
   existingResourceError,
   forbiddenError
} from '../../../lib/errorMessages';

export default new Hono().post(
   '/',
   zValidator(
      'json',
      z.object({
         rackId: z
            .number({ error: 'Rack ID must be a number' })
            .min(1, { error: 'Rack ID must be greater than 0' }),
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { error: 'Name is required' }),
         size: z
            .number({ error: 'Size must be a number' })
            .int({ error: 'Size must be a whole number' })
            .min(1, { error: 'Size must be greater than 0' }),
         position: z
            .number({ error: 'Position must be a number' })
            .int({ error: 'Position must be a whole number' })
            .min(1, { error: 'Position must be greater than 0' }),
         paths: z
            .array(
               z.object({
                  path: z.string({ error: 'Path must be a string' }).trim(),
                  name: z.string({ error: 'Data name must be a string' }).trim()
               })
            )
            .default([]),
         json: z.object({
            text: z
               .string({ error: 'Text must be a string' })
               .trim()
               .min(1, { error: 'Text is required' })
         })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['asset.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { json, paths, ...rest } = c.req.valid('json');

         // Try and get any existing assets from the database
         const existingAsset = await prisma.asset.findFirst({
            where: {
               name: rest.name,
               server: {
                  isNot: null
               }
            },
            select: {
               id: true
            }
         });

         // Check if a asset already exists
         if (existingAsset) {
            return existingResourceError(c);
         }

         // Try's to retrieve the rack from the database
         const rack = await prisma.storage.findFirst({
            where: {
               id: rest.rackId
            },
            select: {
               id: true
            }
         });

         // Checks whether the rack exists
         if (!rack) {
            return notFoundError(c);
         }

         // Check if json is valid
         if (!isValidJson(json.text)) {
            return invalidJsonError(c);
         }

         const result = await prisma.asset.create({
            data: {
               name: rest.name,
               position: rest.position,
               server: {
                  create: {
                     size: rest.size
                  }
               },
               paths: {
                  createMany: {
                     data: paths
                  }
               },
               json: {
                  create: {
                     rawJson: json.text
                  }
               }
            },
            include: {
               server: true,
               paths: true,
               json: true,
               storage: true
            }
         });

         return c.json(
            {
               id: result.id,
               rackId: result.storageId,
               name: result.name,
               position: result.position,
               size: result.server?.size,
               data: result.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path,
                  value: getValueFromJson<String>(
                     JSON.parse(result.json[0].rawJson ?? {}),
                     path.path
                  )
               })),
               json: {
                  id: result.json[0].id,
                  text: result.json[0].rawJson,
                  position: 0,
                  total: 1
               }
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
