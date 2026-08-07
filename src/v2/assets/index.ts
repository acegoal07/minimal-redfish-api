import { Hono } from 'hono';
import deleteAsset from './controllers/deleteAsset';
import createServerAsset from './controllers/servers/createServerAsset';
import createStorageAsset from './controllers/storages/createStorageAsset';
import getAllAssets from './controllers/getAllAssets';

export default new Hono()
   .route('/servers', createServerAsset)
   .route('/:id', deleteAsset)
   .route('/storages', createStorageAsset)
   .route('/', getAllAssets);
