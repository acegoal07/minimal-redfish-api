import { Hono } from 'hono';

import assets from './assets';
import racks from './racks';
import users from './users';
import templates from './templates';
import roles from './roles';
import permissions from './permissions';

export default new Hono()
   .route('/assets', assets)
   .route('/permissions', permissions)
   .route('/racks', racks)
   .route('/roles', roles)
   .route('/templates', templates)
   .route('/users', users);
