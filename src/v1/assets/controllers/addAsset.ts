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
            .optional(),
         json: z.object({
            text: z
               .string({ error: 'Text must be a string' })
               .trim()
               .min(1, { error: 'Text is required' }),
            filename: z
               .string({ error: 'Filename must be a string' })
               .trim()
               .min(1, { error: 'Filename is required' })
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
         if (!validatePermissions(['asset.read', 'asset.write'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { json, paths, ...rest } = c.req.valid('json');

         // Try and get any existing assets from the database
         const existingAsset = await prisma.asset.findFirst({
            where: {
               name: rest.name
            },
            select: {
               id: true
            }
         });

         // Check if a rack already exists
         if (existingAsset) {
            return existingResourceError(c);
         }

         // Try's to retrieve the rack from the database
         const rack = await prisma.rack.findUnique({
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

         // Handle all the adding to the database in one go
         const result = await prisma.$transaction(async (tx) => {
            // Add the asset to the database
            const asset = await tx.asset.create({
               data: rest
            });

            // Add the json to the database
            const jsonData = await tx.assetJson.create({
               data: {
                  assetId: asset.id,
                  rawJson: JSON.stringify(JSON.parse(json.text)),
                  filename: json.filename
               }
            });

            // Add the data paths to the database if there are any
            if (paths && paths?.length > 0) {
               await tx.assetPath.createMany({
                  data: paths.map((item) => ({
                     assetId: asset.id,
                     path: item.path,
                     name: item.name
                  }))
               });
            }

            // Get the ids of all the datafield in the database
            const assetPaths = await tx.assetPath.findMany({
               where: {
                  assetId: asset.id
               }
            });

            return {
               asset,
               assetPaths,
               jsonData
            };
         });

         return c.json(
            {
               id: result.asset.id,
               rackId: result.asset.rackId,
               name: result.asset.name,
               position: result.asset.position,
               size: result.asset.size,
               data: result.assetPaths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path,
                  value: getValueFromJson<String>(JSON.parse(result.jsonData.rawJson), path.path)
               })),
               json: {
                  id: result.jsonData.id,
                  text: result.jsonData.rawJson,
                  filename: result.jsonData.filename
               },
               pagination: {
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
