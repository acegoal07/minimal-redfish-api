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
         refresh: z
            .string({ error: 'Refresh Token must be a string' })
            .trim()
            .min(1, { error: 'Refresh Token cannot be empty' })
      }),
      (result, c) => {
         if (!result.success) {
            return invalidBodyError(c, result);
         }
      }
   ),
   async (c) => {
      const { refresh } = c.req.valid('json');

      console.log(c.req.valid('json'))
      const refreshTokenHash = createHash('sha256')
         .update(refresh)
         .digest('hex')
         .toLowerCase();

      // Try and find the refresh token in the database
      const userRefresh = await prisma.userRefreshToken.findUnique({
         where: {
            tokenHash: refreshTokenHash,
            expiresAt: {
               gt: new Date()
            }
         },
         include: {
            user: true
         }
      });

      // Check if the refresh token exists
      if (!userRefresh) {
         return unauthorisedError(c);
      }

      // Get timestamps
      const tokenIssuedAt = Math.floor(Date.now() / 1000);
      const tokenExpiresAt = Math.floor(Date.now() / 1000) + 60 * 15;
      const refreshTokenExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

      // Generate JWT token
      const newToken = await sign(
         {
            sub: userRefresh.user.id.toString(),
            type: 'access',
            iat: tokenIssuedAt,
            exp: tokenExpiresAt
         },
         process.env.JWT_SECRET!
      );

      // Generate JWT refresh token
      const newRefreshToken = await sign(
         {
            sub: userRefresh.user.id.toString(),
            type: 'refresh',
            iat: tokenIssuedAt,
            exp: refreshTokenExpiresAt
         },
         process.env.JWT_REFRESH_SECRET!
      );
      const newRefreshTokenHash = createHash('sha256')
         .update(newRefreshToken)
         .digest('hex')
         .toLowerCase();

      await prisma.userRefreshToken.update({
         data: {
            tokenHash: newRefreshTokenHash,
            expiresAt: new Date(refreshTokenExpiresAt * 1000)
         },
         where: {
            id: userRefresh.id
         }
      });

      return c.json(
         {
            issuedAt: new Date(tokenIssuedAt * 1000),
            token: {
               token: newToken,
               expiresAt: new Date(tokenExpiresAt * 1000)
            },
            refresh: {
               token: newRefreshToken,
               expiresAt: new Date(refreshTokenExpiresAt * 1000)
            }
         },
         200
      );
   }
);
