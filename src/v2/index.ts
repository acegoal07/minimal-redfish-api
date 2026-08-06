import { Hono } from 'hono';

import users from './users';
import roles from './roles';
import permissions from './permissions';
import templates from './templates';

export default new Hono()
   .route('/permissions', permissions)
   .route('/roles', roles)
   .route('/templates', templates)
   .route('/users', users);
