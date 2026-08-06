import { Hono } from 'hono';

import users from './users';
import roles from './roles';
import permissions from './permissions';
import templates from './templates';
import groups from './groups';
import tags from './tags';
import assets from './assets';

export default new Hono()
   .route('/assets', assets)
   .route('/groups', groups)
   .route('/permissions', permissions)
   .route('/roles', roles)
   .route('/tags', tags)
   .route('/templates', templates)
   .route('/users', users);
