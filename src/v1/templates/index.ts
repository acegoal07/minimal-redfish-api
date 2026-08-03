import { Hono } from 'hono';

import getAllTemplates from './controllers/getAllTemplates';
import addTemplate from './controllers/addTemplate';
import getRackById from '../racks/controllers/getRackById';
import updateTemplate from './controllers/updateTemplate';
import deleteTemplate from './controllers/deleteTemplate';

export default new Hono()
   .route('/', getAllTemplates)
   .route('/', addTemplate)
   .route('/:id', getRackById)
   .route('/:id', updateTemplate)
   .route('/:id', deleteTemplate);
