import type { Prisma } from '@prisma/client';
import type { JWTPayload } from 'hono/utils/jwt/types';

type AuthUser = Prisma.UserGetPayload<{
   include: {
      role: {
         include: {
            permissions: true;
         };
      };
   };
}>;

declare module 'hono' {
   interface ContextVariableMap {
      user: AuthUser;

      jwtPayload: JWTPayload & {
         sub: string;
         iat: number;
         exp: number;
         type: string;
      };
   }
}

export {};
