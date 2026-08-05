import 'dotenv/config';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { compress } from 'hono/compress';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { jwt } from 'hono/jwt';

import { internalServerError, unauthorisedError } from './lib/errorMessages';
import { prisma } from './lib/prisma';

import v1 from './v1';

const app = new Hono();

// Load all the middleware
app.use(
   '*',
   cors({
      allowMethods: ['POST', 'GET', 'DELETE', 'PATCH', 'PUT', 'OPTIONS']
   })
);

app.use('*', trimTrailingSlash());
app.use('*', compress());

// Check JWT token is valid
const publicRoutes = new Set(['/api/v1/users/login']);
app.use('/api/*', async (c, next) => {
   if (publicRoutes.has(c.req.path)) {
      return next();
   }

   return jwt({
      secret: process.env.JWT_SECRET!,
      alg: 'HS256'
   })(c, next);
});

// Get user information is JWT token is valid
app.use('/api/*', async (c, next) => {
   if (publicRoutes.has(c.req.path)) {
      return next();
   }

   const payload = c.get('jwtPayload');

   const user = await prisma.user.findUnique({
      where: {
         id: Number(payload.sub)
      },
      include: {
         role: {
            include: {
               permissions: {
                  select: {
                     name: true
                  }
               }
            }
         }
      }
   });

   if (!user) {
      return c.json({ error: 'User not found' }, 404);
   }

   c.set('user', user);

   await next();
});

// 404 Error
app.notFound((c) =>
   c.json(
      {
         error: 'Not Found',
         message: `well well well, what have we here then`
      },
      404
   )
);

// Handle uncaught errors
app.onError((err, c) => {
   if (err.res?.status === 401) {
      return unauthorisedError(c);
   }

   return internalServerError(c, err);
});

// Load endpoints
app.route('/api/v1', v1);

// Start listening to port
serve({
   fetch: app.fetch,
   port: Number(process.env.PORT) || 3000
});
