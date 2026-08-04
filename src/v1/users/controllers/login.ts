import { createHash } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { z } from 'zod';

import { prisma } from '../../../lib/prisma';
import { invalidBodyError, unauthorisedError } from '../../../lib/errorMessages';

export default new Hono().post(
   '/',
   zValidator(
      'json',
      z.object({
         username: z
            .string({ error: 'Username must be a string' })
            .trim()
            .min(1, { message: 'Username cannot be empty' }),

         password: z
            .string({ error: 'Password must be a string' })
            .trim()
            .min(1, { message: 'Password cannot be empty' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      const { username, password } = c.req.valid('json');
      const passwordHash = createHash('sha256').update(password).digest('hex').toLowerCase();

      // Try and get the user from the database
      const user = await prisma.user.findFirst({
         where: {
            username,
            passwordHash
         },
         select: {
            id: true,
            roleId: true
         }
      });

      // Check if the user exists
      if (!user) {
         return unauthorisedError(c);
      }

      // Generate JWT token
      const token = await sign(
         {
            sub: user.id,
            username,
            role: user.roleId,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
         },
         process.env.JWT_SECRET!
      );

      return c.json(
         {
            token
         },
         200
      );
   }
);
