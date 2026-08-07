import { Hono } from 'hono';

import getAllTags from './controllers/getAllTags';
import createTag from './controllers/createTag';
import deleteTag from './controllers/deleteTag';
import updateTag from './controllers/updateTag';
import searchGroups from '../groups/controllers/searchGroups';

export default new Hono()
   .route('/search', searchGroups)
   .route('/:id', updateTag)
   .route('/:id', deleteTag)
   .route('/', createTag)
   .route('/', getAllTags);
