import { Hono } from 'hono';

import getAllRacks from './controller/getAllRacks';
import getRackById from './controller/getRackById';
import deleteRackById from './controller/deleteRackById';
import addRack from './controller/addRack';
import updateRack from './controller/updateRack';
import getAllAssetsByRackId from './controller/getAssetByRackId';

export default new Hono()
   .route('/', getAllRacks)
   .route('/', addRack)
   .route('/', getAllAssetsByRackId)
   .route('/', getRackById)
   .route('/', updateRack)
   .route('/', deleteRackById);
