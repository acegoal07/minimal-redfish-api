import { Hono } from 'hono';

import assets from './assets';
import racks from './racks';

export default new Hono().route('/assets', assets).route('/racks', racks);
