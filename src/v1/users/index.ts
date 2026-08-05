import { Hono } from 'hono';

import loginUser from './controllers/loginUser';
import createUser from './controllers/createUser';
import deleteUser from './controllers/deleteUser';
import refreshLogin from './controllers/refreshLogin';
import logoutUser from './controllers/logoutUser';

export default new Hono()
   .route('/login', loginUser)
   .route('/refresh', refreshLogin)
   .route('/logout', logoutUser)
   .route('/', createUser)
   .route('/', deleteUser);
