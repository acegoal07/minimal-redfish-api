import { Hono } from 'hono';
import deleteAsset from './controllers/deleteAsset';
import addPathToAsset from './controllers/paths/addPathToAsset';
import createServerAsset from './controllers/servers/createServerAsset';
import createStorageAsset from './controllers/storages/createStorageAsset';
import getAllAssets from './controllers/getAllAssets';

export default new Hono()
   .route('/:id/paths', addPathToAsset)
   .route('/:id', deleteAsset)
   .route('/servers', createServerAsset)
   .route('/storages', createStorageAsset)
   .route('/', getAllAssets);
