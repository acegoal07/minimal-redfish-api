import 'dotenv/config';

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import endpoints from './endpoints';

const app = new Hono();

app.route('/api', endpoints);

serve({
   fetch: app.fetch,
   port: Number(process.env.PORT) || 3000
});
