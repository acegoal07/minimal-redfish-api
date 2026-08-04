import { Hono } from 'hono';

import getAllTemplates from './controllers/getAllTemplates';
import addTemplate from './controllers/addTemplate';
import updateTemplate from './controllers/updateTemplate';
import deleteTemplate from './controllers/deleteTemplate';
import getTemplatePaths from './controllers/getTemplatePaths';
import addPathToTemplate from './controllers/addPathToTemplate';
import updateTemplatePath from './controllers/updateTemplatePath';
import searchTemplate from './controllers/searchTemplate';
import getTemplateById from './controllers/getTemplateById';

export default new Hono()
   .route('/search', searchTemplate)
   .route('/:id/paths/:pathId', updateTemplatePath)
   .route('/:id/paths', getTemplatePaths)
   .route('/:id/paths', addPathToTemplate)
   .route('/:id', getTemplateById)
   .route('/:id', updateTemplate)
   .route('/:id', deleteTemplate)
   .route('/', getAllTemplates)
   .route('/', addTemplate);
