import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson, validatePermissions } from '../../../lib/util';
import {
   forbiddenError,
   internalServerError,
   invalidBodyError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().patch(
   '/',
   zValidator(
      'param',
      z.object({
         id: z.coerce
            .number({ error: 'ID must be a number' })
            .int({ error: 'ID must be a whole number' })
            .positive({ error: 'ID must be greater than 0' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidParametersError(c, result);
         }
      }
   ),
   zValidator(
      'json',
      z
         .object({
            rackId: z
               .number({ error: 'Rack ID must be a number' })
               .int({ error: 'Rack ID must be a whole number' })
               .min(1, { error: 'Rack ID must be greater than 0' })
               .optional(),
            name: z
               .string({ error: 'Name must be a string' })
               .trim()
               .min(1, { error: 'Name cannot be empty' })
               .optional(),
            size: z
               .number({ error: 'Size must be a number' })
               .int({ error: 'Size must be a whole number' })
               .min(1, { error: 'Size must be greater than 0' })
               .optional(),
            position: z
               .number({ error: 'Position must be a number' })
               .int({ error: 'Position must be a whole number' })
               .min(1, { error: 'Position must be greater than 0' })
               .optional()
         })
         .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field must be provided'
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
         const { id } = c.req.valid('param');
         const body = c.req.valid('json');

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id
            },
            include: {
               json: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  select: {
                     id: true,
                     rawJson: true,
                     filename: true
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
               _count: {
                  select: {
                     json: true
                  }
               }
            }
         });

         // Check whether the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         // Try and get the new rack
         if (body.rackId) {
            const rack = await prisma.rack.findUnique({
               where: {
                  id: body.rackId
               }
            });

            // Check if the rack exists
            if (!rack) {
               return notFoundError(c);
            }
         }

         // Update asset in the database
         const updatedAsset = await prisma.asset.update({
            data: {
               name: body.name ?? asset.name,
               rackId: body.rackId ?? asset.rackId,
               size: body.size ?? asset.size,
               position: body.position ?? asset.position
            },
            where: {
               id
            }
         });

         return c.json(
            {
               id: updatedAsset.id,
               name: updatedAsset.name,
               position: updatedAsset.position,
               size: updatedAsset.size,
               rackId: updatedAsset.rackId,
               data: asset.paths.map((path) => ({
                  id: path.id,
                  name: path.name,
                  path: path.path,
                  value: getValueFromJson<string>(JSON.parse(asset.json[0]?.rawJson), path.path)
               })),
               json: {
                  id: asset.json[0]?.id,
                  text: asset.json[0]?.rawJson,
                  filename: asset.json[0]?.filename
               },
               pagination: {
                  position: 0,
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
