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
            .min(1, { error: 'Username cannot be empty' }),
         password: z
            .string({ error: 'Password must be a string' })
            .trim()
            .min(1, { error: 'Password cannot be empty' })
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

      // Get timestamps
      const tokenIssuedAt = Math.floor(Date.now() / 1000);
      const tokenExpiresAt = Math.floor(Date.now() / 1000) + 60 * 15;
      const refreshTokenExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

      // Generate JWT token
      const token = await sign(
         {
            sub: user.id.toString(),
            type: 'access',
            iat: tokenIssuedAt,
            exp: tokenExpiresAt
         },
         process.env.JWT_SECRET!
      );

      // Generate JWT refresh token
      const refreshToken = await sign(
         {
            sub: user.id.toString(),
            type: 'refresh',
            iat: tokenIssuedAt / 1000,
            exp: refreshTokenExpiresAt / 1000
         },
         process.env.JWT_REFRESH_SECRET!
      );
      const refreshTokenHash = createHash('sha256')
         .update(refreshToken)
         .digest('hex')
         .toLowerCase();

      // See if the user already has a refresh token
      const existingRefresh = await prisma.userRefreshToken.findUnique({
         where: {
            userId: user.id
         },
         select: {
            id: true
         }
      });

      // Handle either updating the refresh token in the table or creating one
      if (existingRefresh) {
         await prisma.userRefreshToken.update({
            data: {
               tokenHash: refreshTokenHash,
               expiresAt: new Date(refreshTokenExpiresAt * 1000)
            },
            where: {
               id: existingRefresh.id
            }
         });
      } else {
         await prisma.userRefreshToken.create({
            data: {
               userId: user.id,
               tokenHash: refreshTokenHash,
               expiresAt: new Date(refreshTokenExpiresAt * 1000)
            }
         });
      }

      return c.json(
         {
            issuedAt: new Date(tokenIssuedAt * 1000),
            token: {
               token,
               expiresAt: new Date(tokenExpiresAt * 1000)
            },
            refreshToken: {
               token: refreshToken,
               expiresAt: new Date(refreshTokenExpiresAt * 1000)
            }
         },
         200
      );
   }
);
