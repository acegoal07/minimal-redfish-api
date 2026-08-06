import { Hono } from 'hono';

import getAllTags from './controllers/getAllTags';
import createTag from './controllers/createTag';
import deleteTag from './controllers/deleteTag';
import updateTag from './controllers/updateTag';

export default new Hono()
   .route('/:id', updateTag)
   .route('/:id', deleteTag)
   .route('/', createTag)
   .route('/', getAllTags);
