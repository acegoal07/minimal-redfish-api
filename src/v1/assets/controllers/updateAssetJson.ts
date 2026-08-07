import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { getValueFromJson, isValidJson, validatePermissions } from '../../../lib/util';
import {
   forbiddenError,
   internalServerError,
   invalidJsonError,
   notFoundError
} from '../../../lib/errorMessages';
import { bodyValidator, idParamValidator } from '../../../lib/validators';

export default new Hono().post(
   '/',
   idParamValidator({}),
   bodyValidator(
      z.object({
         json: z.object({
            text: z
               .string({ error: 'Text must be a string' })
               .trim()
               .min(1, { error: 'Text cannot be empty' })
         })
      })
   ),
   async (c) => {
      try {
         // Check users permissions
         if (!validatePermissions(['asset.update'], c)) {
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
               id: id,
               server: {
                  isNot: null
               }
            },
            include: {
               server: true,
               paths: true,
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
               rawJson: JSON.stringify(JSON.parse(json.text))
            }
         });

         return c.json(
            {
               id: asset.id,
               name: asset.name,
               position: asset.position,
               size: asset.server?.size,
               rackId: asset.storageId,
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
