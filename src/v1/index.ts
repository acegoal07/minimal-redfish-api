import { Hono } from 'hono';

import assets from './assets';
import racks from './racks';
import users from './users';
import templates from './templates';

export default new Hono()
   .route('/assets', assets)
   .route('/racks', racks)
   .route('/templates', templates)
   .route('/users', users);
