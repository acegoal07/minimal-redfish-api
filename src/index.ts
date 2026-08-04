import 'dotenv/config';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { compress } from 'hono/compress';
import { internalServerError, unauthorisedError } from './lib/errorMessages';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { jwt } from 'hono/jwt';
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

app.notFound((c) =>
   c.json(
      {
         error: 'Not Found',
         message: `well well well, what have we here then`
      },
      404
   )
);

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
