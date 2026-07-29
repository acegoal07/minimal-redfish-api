import 'dotenv/config';

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import v1 from './v1';

const app = new Hono();

app.route('/api/v1', v1);

serve({
   fetch: app.fetch,
   port: Number(process.env.PORT) || 3000
});
