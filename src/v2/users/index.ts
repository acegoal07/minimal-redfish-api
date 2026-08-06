import { Hono } from 'hono';

import loginUser from './controllers/loginUser';
import createUser from './controllers/createUser';
import deleteUser from './controllers/deleteUser';
import refreshLogin from './controllers/refreshLogin';
import logoutUser from './controllers/logoutUser';
import updateUser from './controllers/updateUser';
import getCurrentUser from './controllers/getCurrentUser';

export default new Hono()
   .route('/login', loginUser)
   .route('/refresh', refreshLogin)
   .route('/logout', logoutUser)
   .route('/current', getCurrentUser)
   .route('/:id', updateUser)
   .route('/', createUser)
   .route('/', deleteUser);
