import { Hono } from 'hono';

import getAllPermissions from './controllers/getAllPermissions';

export default new Hono().route('/', getAllPermissions);
