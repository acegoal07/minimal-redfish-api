import { Hono } from 'hono';

import loginUser from './controllers/loginUser';
import createUser from './controllers/createUser';
import deleteUser from './controllers/deleteUser';
import refreshLogin from './controllers/refreshLogin';
import logoutUser from './controllers/logoutUser';
import updateUser from './controllers/updateUser';
import getCurrentUser from '../../v1/users/controllers/getCurrentUser';
import getAllUsers from '../../v1/users/controllers/getAllUsers';

export default new Hono()
   .route('/login', loginUser)
   .route('/refresh', refreshLogin)
   .route('/logout', logoutUser)
   .route('/current', getCurrentUser)
   .route('/:id', updateUser)
   .route('/:id', deleteUser)
   .route('/', getAllUsers)
   .route('/', createUser)
   .route('/', deleteUser);
