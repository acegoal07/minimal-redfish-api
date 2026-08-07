import { Hono } from 'hono';

import deleteAsset from './controllers/deleteAsset';
import addPathToAsset from './controllers/paths/addPathToAsset';
import createServerAsset from './controllers/servers/createServerAsset';
import createStorageAsset from './controllers/storages/createStorageAsset';
import getAllAssets from './controllers/getAllAssets';
import deleteAssetPath from './controllers/paths/deleteAssetPath';
import getAssetPaths from './controllers/paths/getAssetPaths';
import updateAssetPath from './controllers/paths/updateAssetPath';
import searchAssets from './controllers/searchAssets';
import getAssetHistory from './controllers/history/getAssetHistory';
import getAllServerAssets from './controllers/servers/getAllServerAssets';
import getAllStorageAssets from './controllers/storages/getAllStorageAssets';
import addAssetHistory from './controllers/history/addAssetHistory';
import deleteAssetHistory from './controllers/history/deleteAssetHistory';
import getAssetById from './controllers/getAssetById';
import addTagsToAsset from './controllers/tags/addTagsToAsset';
import getStorageAssetById from './controllers/storages/getStorageAssetById';
import getServerAssetById from './controllers/servers/getServerAssetById';
import updateServerAsset from './controllers/servers/updateServerAsset';
import updateStorageAssets from './controllers/storages/updateStorageAssets';
import updateAsset from './controllers/updateAsset';
import createAsset from './controllers/createAsset';
import removeTagsFromAsset from './controllers/tags/removeTagsFromAsset';
import getUpsAssetById from './controllers/ups/getUpsAssetById';
import updateUpsAsset from './controllers/ups/updateUpsAsset';
import createUpsAsset from './controllers/ups/createUpsAsset';
import getAllUpsAssets from './controllers/ups/getAllUpsAssets';

export default new Hono()
   .route('/search', searchAssets)

   .route('/servers/:id', getServerAssetById)
   .route('/servers/:id', updateServerAsset)
   .route('/servers', createServerAsset)
   .route('/servers', getAllServerAssets)

   .route('/storages/:id', getStorageAssetById)
   .route('/storages/:id', updateStorageAssets)
   .route('/storages', createStorageAsset)
   .route('/storages', getAllStorageAssets)

   .route('/ups/:id', getUpsAssetById)
   .route('/ups/:id', updateUpsAsset)
   .route('/ups', createUpsAsset)
   .route('/ups', getAllUpsAssets)

   .route('/:id/paths/:pathId', deleteAssetPath)
   .route('/:id/paths', addPathToAsset)
   .route('/:id/paths', getAssetPaths)
   .route('/:id/paths', updateAssetPath)

   .route('/:id/history/:historyId', deleteAssetHistory)
   .route('/:id/history', addAssetHistory)
   .route('/:id/history', getAssetHistory)

   .route('/:id/tags/add', addTagsToAsset)
   .route('/:id/tags/remove', removeTagsFromAsset)

   .route('/:id', getAssetById)
   .route('/:id', deleteAsset)
   .route('/:id', updateAsset)
   .route('/', deleteAsset)
   .route('/', getAllAssets)
   .route('/', createAsset);
