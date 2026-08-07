import { Hono } from 'hono';
import deleteAsset from './controllers/deleteAsset';
import addPathToAsset from './controllers/paths/addPathToAsset';
import createServerAsset from './controllers/servers/createServerAsset';
import createStorageAsset from './controllers/storages/createStorageAsset';
import getAllAssets from './controllers/getAllAssets';
import deleteAssetPath from './controllers/paths/deleteAssetPath';
import getAssetPaths from './controllers/paths/getAssetPaths';
import updateAssetPath from './controllers/paths/updateAssetPath';
import getAssetHistory from './controllers/history/getAssetHistory';

export default new Hono()
   .route('/:id/paths/:pathId', deleteAssetPath)
   .route('/:id/paths', addPathToAsset)
   .route('/:id/paths', getAssetPaths)
   .route('/:id/paths', updateAssetPath)
   .route('/:id/history', getAssetHistory)
   .route('/:id', deleteAsset)
   .route('/servers', createServerAsset)
   .route('/storages', createStorageAsset)
   .route('/', deleteAsset)
   .route('/', getAllAssets);
