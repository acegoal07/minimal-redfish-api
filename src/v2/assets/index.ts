import { Hono } from 'hono';
import deleteAsset from './controllers/deleteAsset';
import createServerAsset from './controllers/servers/createServerAsset';

export default new Hono().route('/servers', createServerAsset).route('/:id', deleteAsset);
