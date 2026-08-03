import { Hono } from 'hono';

import login from './controllers/login';

export default new Hono().route('/login', login);
