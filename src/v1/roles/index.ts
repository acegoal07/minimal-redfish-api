import { Hono } from 'hono';

import createRole from './controllers/createRole';
import deleteRole from './controllers/deleteRole';
import addPermissionToRole from './controllers/addPermissionToRole';
import removePermissionFromRole from './controllers/removePermissionFromRole';

export default new Hono()
   .route('/permissions/:id/add', addPermissionToRole)
   .route('/permissions/:id/remove', removePermissionFromRole)
   .route('/', createRole)
   .route('/', deleteRole);
