import { Hono } from 'hono';

import getAllGroups from './controllers/getAllGroups';
import createGroup from './controllers/createGroup';
import updateGroup from './controllers/updateGroup';
import deleteGroup from './controllers/deleteGroup';
import getGroupById from './controllers/getGroupById';
import searchGroups from './controllers/searchGroups';

export default new Hono()
   .route('/search', searchGroups)
   .route('/:id', getGroupById)
   .route('/:id', deleteGroup)
   .route('/:id', updateGroup)
   .route('/', getAllGroups)
   .route('/', createGroup);
