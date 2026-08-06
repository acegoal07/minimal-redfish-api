import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';

export default new Hono().post('/', async (c) => {
   // Get the user information
   const user = c.get('user');

   // Remove the refresh token from the database
   await prisma.userRefreshToken.delete({
      where: {
         userId: user.id
      }
   });

   return c.json(204);
});
