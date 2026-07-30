import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { internalServerError, invalidBodyError, notFoundError } from '../../../lib/errorMessages';
import { getValueFromJson } from '../../../lib/util';

export default new Hono().post(
   '/',
   zValidator(
      'json',
      z.object({
         rackId: z
            .number({ error: 'Rack ID must be a number' })
            .min(1, { message: 'Rack ID must be greater than 0' }),
         name: z
            .string({ error: 'Name must be a string' })
            .trim()
            .min(1, { message: 'Name is required' }),
         size: z
            .number({ error: 'Size must be a number' })
            .min(1, { message: 'Size must be greater than 0' }),
         position: z
            .number({ error: 'Position must be a number' })
            .min(1, { message: 'Position must be greater than 0' }),
         data: z
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
               .min(1, { message: 'Text is required' }),
            filename: z
               .string({ error: 'Filename must be a string' })
               .trim()
               .min(1, { message: 'Filename is required' })
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
         const { json, data, ...rest } = c.req.valid('json');

         // Try's to retrieve the rack from the database
         const rack = await prisma.rack.findUnique({
            where: {
               id: rest.rackId
            }
         });

         // Checks whether the rack exists
         if (!rack) {
            return notFoundError(c);
         }

         // Handle all the adding to the database in one go
         const result = await prisma.$transaction(async (tx) => {
            // Add the asset to the database
            const asset = await tx.asset.create({
               data: rest
            });

            // Add the json to the database
            await tx.jsonHistory.create({
               data: {
                  assetId: asset.id,
                  rawJson: json.text,
                  filename: json.filename
               }
            });

            // Add the data paths to the database if there are any
            if (data && data?.length > 0) {
               await tx.path.createMany({
                  data: data.map((item) => ({
                     assetId: asset.id,
                     ...item
                  }))
               });
            }

            // Get the ids of all the datafield in the database
            const assetPaths = await tx.path.findMany({
               where: {
                  assetId: asset.id
               }
            });

            return {
               asset,
               assetPaths
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
                  value: getValueFromJson<String>(JSON.parse(json.text), path.path)
               })),
               json: {
                  text: json.text,
                  filename: json.filename
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
