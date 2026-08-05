import { Hono } from 'hono';

import createRole from './controllers/createRole';
import deleteRole from './controllers/deleteRole';
import addPermissionToRole from './controllers/addPermissionToRole';
import removePermissionFromRole from './controllers/removePermissionFromRole';
import getRoleById from './controllers/getRoleById';
import getAllRoles from './controllers/getAllRoles';
import searchRole from './controllers/searchRole';

export default new Hono()
   .route('/search', searchRole)
   .route('/permissions/:id/add', addPermissionToRole)
   .route('/permissions/:id/remove', removePermissionFromRole)
   .route('/:id', getRoleById)
   .route('/:id', deleteRole)
   .route('/', getAllRoles)
   .route('/', createRole);
