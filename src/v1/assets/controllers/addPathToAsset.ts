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
            .min(1, {
               error: 'At least one path is required'
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
         const body = c.req.valid('json');

         // Try and get the asset from the database
         const asset = await prisma.asset.findFirst({
            where: {
               id,
               server: {
                  isNot: null
               }
            },
            include: {
               jsons: {
                  orderBy: {
                     uploadDate: 'desc'
                  },
                  take: 1,
                  select: {
                     rawJson: true
                  }
               }
            }
         });

         // Check whether the asset exists
         if (!asset) {
            return notFoundError(c);
         }

         // Add all the new paths to the asset
         const newPaths = await prisma.$transaction(
            body.paths.map((path) =>
               prisma.assetPath.create({
                  data: {
                     name: path.name,
                     path: path.path,
                     assetId: id
                  }
               })
            )
         );

         return c.json(
            newPaths.map((path) => ({
               id: path.id,
               path: path.path,
               name: path.name,
               value: getValueFromJson<string>(JSON.parse(asset.json[0]?.rawJson), path.path)
            })),
            201
         );
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
