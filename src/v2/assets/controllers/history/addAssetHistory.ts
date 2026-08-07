import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '../../../../lib/prisma';
import { getValueFromJson, isValidJson, validatePermissions } from '../../../../lib/util';
import {
   forbiddenError,
   internalServerError,
   invalidJsonError,
   notFoundError
} from '../../../../lib/errorMessages';
import { bodyValidator, idParamValidator } from '../../../../lib/validators';

export default new Hono().post(
   '/',
   idParamValidator({}),
   bodyValidator(
      z.object({
         json: z
            .string({ error: 'Text must be a string' })
            .trim()
            .min(1, { error: 'Text cannot be empty' })
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
         if (!isValidJson(json)) {
            return invalidJsonError(c);
         }

         // Try and get the asset from the database
         const asset = await prisma.asset.findUnique({
            where: {
               id: id
            },
            include: {
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
               rawJson: JSON.stringify(JSON.parse(json))
            }
         });

         return c.json({
            id: newJson.id,
            rawJson: newJson.rawJson
         });
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
