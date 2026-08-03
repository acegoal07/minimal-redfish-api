import { Hono } from 'hono';

import getAllAssets from './controller/getAllAssets';
import getAssetById from './controller/getAssetById';
import deleteAssetById from './controller/deleteAssetById';
import addAsset from './controller/addAsset';
import updateAssetJson from './controller/updateAssetJson';
import updateAsset from './controller/updateAsset';
import getAssetPaths from './controller/getAssetPaths';
import updateAssetPath from './controller/updateAssetPath';
import deleteAssetPath from './controller/deleteAssetPath';
import getAssetByIdWithIndex from './controller/getAssetByIdWithIndex';
import addPathToAsset from './controller/addPathToAsset';
import deleteAssetHistory from './controller/deleteAssetHistory';
import getAssetHistory from './controller/getAssetHistory';
import searchAsset from './controller/searchAsset';

export default new Hono()
   .route('/search', searchAsset)
   .route('/', getAllAssets)
   .route('/', addAsset)
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
   .route('/:id', deleteAssetById);
