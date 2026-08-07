import { Hono } from 'hono';
import { z } from 'zod';
import { createHash } from 'node:crypto';

import { prisma } from '../../../lib/prisma';
import {
   existingResourceError,
   forbiddenError,
   internalServerError,
   notFoundError
} from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';
import { bodyValidator } from '../../../lib/validators';

export default new Hono().post(
   '/',
   bodyValidator(
      z.object({
         username: z
            .string({ error: 'Username must be a string' })
            .trim()
            .min(1, { error: 'Username cannot be empty' }),
         password: z
            .string({ error: 'Notes must be a string' })
            .trim()
            .min(1, { error: 'Password cannot be empty' }),
         roleId: z.coerce
            .number({ error: 'Role ID must be a number' })
            .int({ error: 'Role ID must be a whole number' })
            .positive({ error: 'Role ID must be greater than 0' })
      })
   ),
   async (c) => {
      try {
         // Check user permissions
         if (!validatePermissions(['user.create'], c)) {
            return forbiddenError(c);
         }

         // Get request information
         const { username, password, roleId } = c.req.valid('json');

         // Try and get a user from the database with the same username
         const existingUser = await prisma.user.findUnique({
            where: {
               username: username
            },
            select: {
               id: true
            }
         });

         // Check if a user already exists
         if (existingUser) {
            return existingResourceError(c);
         }

         // Try and get the role from the database
         const role = await prisma.role.findUnique({
            where: {
               id: roleId
            },
            select: {
               id: true
            }
         });

         // Check if role exists
         if (!role) {
            return notFoundError(c);
         }

         // Hash password
         const passwordHash = createHash('sha256').update(password).digest('hex').toLowerCase();

         // Create user in the database
         await prisma.user.create({
            data: {
               username: username,
               passwordHash: passwordHash,
               roleId
            }
         });

         return c.json(201);
      } catch (err) {
         return internalServerError(c, err);
      }
   }
);
