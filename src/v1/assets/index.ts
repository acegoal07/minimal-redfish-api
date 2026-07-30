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
import deleteAssetJson from './controller/deleteAssetHistory';

export default new Hono()
   .route('/', getAllAssets)
   .route('/', addAsset)
   .route('/', getAssetPaths)
   .route('/', addPathToAsset)
   .route('/', updateAssetPath)
   .route('/', deleteAssetPath)
   .route('/', deleteAssetJson)
   .route('/', getAssetByIdWithIndex)
   .route('/', getAssetById)
   .route('/', updateAssetJson)
   .route('/', updateAsset)
   .route('/', deleteAssetById);
