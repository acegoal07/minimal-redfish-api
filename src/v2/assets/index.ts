import { Hono } from 'hono';
import deleteAsset from './controllers/deleteAsset';
import createServerAsset from './controllers/servers/createServerAsset';
import createStorageAsset from './controllers/storages/createStorageAsset';

export default new Hono()
   .route('/servers', createServerAsset)
   .route('/:id', deleteAsset)
   .route('/storages', createStorageAsset);
