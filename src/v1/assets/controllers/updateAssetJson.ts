import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson, isValidJson, validatePermissions } from '../../../lib/util';
import {
   forbiddenError,
   internalServerError,
   invalidBodyError,
   invalidJsonError,
   invalidParametersError,
   notFoundError
} from '../../../lib/errorMessages';

export default new Hono().post(
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
      z.object({
         json: z.object({
            text: z
               .string({ error: 'Text must be a string' })
               .trim()
               .min(1, { error: 'Text cannot be empty' }),
            filename: z
               .string({ error: 'Filename must be a string' })
               .trim()
               .min(1, { error: 'Filename cannot be empty' })
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
         const { id } = c.req.valid('param');
         const { json } = c.req.valid('json');

         // Check if json is valid
         if (!isValidJson(json.text)) {
            return invalidJsonError(c);
         }

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id: id
            },
            include: {
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

         // Add a new json to the history if a json is passed in
         const newJson = await prisma.assetJson.create({
            data: {
               assetId: id,
               rawJson: JSON.stringify(JSON.parse(json.text)),
               filename: json.filename
            }
         });

         return c.json(
            {
               id: asset.id,
               name: asset.name,
               position: asset.position,
               size: asset.size,
               rackId: asset.rackId,
               data: asset.paths.map((path) => {
                  return {
                     id: path.id,
                     name: path.name,
                     path: path.path,
                     value: getValueFromJson<string>(JSON.parse(newJson.rawJson), path.path)
                  };
               }),
               json: {
                  id: newJson.id,
                  text: newJson.rawJson,
                  filename: newJson.filename
               },
               pagination: {
                  position: 0,
                  total: asset._count.json + 1
               }
            },
            200
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
