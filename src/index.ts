import 'dotenv/config';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { trimTrailingSlash } from 'hono/trailing-slash';
import v1 from './v1';

const app = new Hono();

app.use('*', cors());
app.use('*', trimTrailingSlash());

app.route('/api/v1', v1);

app.notFound((c) =>
   c.json(
      {
         error: 'Not Found',
         message: `well well well, what have we here then`
      },
      404
   )
);

serve({
   fetch: app.fetch,
   port: Number(process.env.PORT) || 3000
});
