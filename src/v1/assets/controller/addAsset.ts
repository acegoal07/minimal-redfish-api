import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { internalServerError, invalidBodyError, notFoundError } from '../../../lib/errorMessages';

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

         // Create asset in the database
         const asset = await prisma.asset.create({
            data: rest
         });

         // Create the first json history
         await prisma.jsonHistory.create({
            data: {
               assetId: asset.id,
               rawJson: json.text,
               filename: json.filename
            }
         });

         // If there are any data fields provided add them to the database
         if (data) {
            await prisma.path.createMany({
               data: data.map((item) => ({
                  assetId: asset.id,
                  ...item
               }))
            });
         }

         // Get all the data fields in the database
         const assetPaths = await prisma.path.findMany({
            where: {
               assetId: asset.id
            }
         });

         return c.json(
            {
               id: asset.id,
               rackId: asset.rackId,
               name: asset.name,
               position: asset.position,
               size: asset.size,
               data: assetPaths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.name
               })),
               json: {
                  text: json.text,
                  filename: json.filename
               },
               pagination: {
                  position: 0,
                  total: 0
               }
            },
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
