import { Hono } from 'hono';

import getAllRacks from './controllers/getAllRacks';
import getRackById from './controllers/getRackById';
import deleteRackById from './controllers/deleteRackById';
import addRack from './controllers/addRack';
import updateRack from './controllers/updateRack';
import getAllAssetsByRackId from './controllers/getAssetByRackId';
import searchRack from './controllers/searchRack';

export default new Hono()
   .route('/search', searchRack)
   .route('/:id/assets', getAllAssetsByRackId)
   .route('/:id', getRackById)
   .route('/:id', updateRack)
   .route('/:id', deleteRackById)
   .route('/', getAllRacks)
   .route('/', addRack);
