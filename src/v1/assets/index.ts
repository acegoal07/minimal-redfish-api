import { Hono } from 'hono';

import getAllAssets from './controllers/getAllAssets';
import getAssetById from './controllers/getAssetById';
import deleteAssetById from './controllers/deleteAssetById';
import addAsset from './controllers/addAsset';
import updateAssetJson from './controllers/updateAssetJson';
import updateAsset from './controllers/updateAsset';
import getAssetPaths from './controllers/getAssetPaths';
import updateAssetPath from './controllers/updateAssetPath';
import deleteAssetPath from './controllers/deleteAssetPath';
import getAssetByIdWithIndex from './controllers/getAssetByIdWithIndex';
import addPathToAsset from './controllers/addPathToAsset';
import deleteAssetHistory from './controllers/deleteAssetHistory';
import getAssetHistory from './controllers/getAssetHistory';
import searchAsset from './controllers/searchAsset';

export default new Hono()
   .route('/search', searchAsset)
   .route('/:id/paths/:pathId', updateAssetPath)
   .route('/:id/paths/:pathId', deleteAssetPath)
   .route('/:id/history/:jsonId', deleteAssetHistory)
   .route('/:id/paths', getAssetPaths)
   .route('/:id/paths', addPathToAsset)
   .route('/:id/history', getAssetHistory)
   .route('/:id/:offset', getAssetByIdWithIndex)
   .route('/:id', getAssetById)
   .route('/:id', updateAssetJson)
   .route('/:id', updateAsset)
   .route('/:id', deleteAssetById)
   .route('/', getAllAssets)
   .route('/', addAsset);
