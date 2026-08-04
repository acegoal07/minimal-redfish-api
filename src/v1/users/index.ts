import { Hono } from 'hono';

import loginUser from './controllers/loginUser';
import createUser from './controllers/createUser';
import deleteUser from './controllers/deleteUser';

export default new Hono().route('/login', loginUser).route('/', createUser).route('/', deleteUser);
