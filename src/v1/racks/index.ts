import { Hono } from 'hono';

import getAllRacks from './controller/getAllRacks';
import getRackById from './controller/getRackById';
import deleteRackById from './controller/deleteRackById';
import addRack from './controller/addRack';
import updateRack from './controller/updateRack';
import getAllAssetsByRackId from './controller/getAssetByRackId';
import searchRack from './controller/searchRack';

export default new Hono()
   .route('/search', searchRack)   
   .route('/', getAllRacks)
   .route('/', addRack)
   .route('/:id/assets', getAllAssetsByRackId)
   .route('/:id', getRackById)
   .route('/:id', updateRack)
   .route('/:id', deleteRackById);
