import { Hono } from 'hono';

export default new Hono().post('/', async (c) => {
   // Get the user information
   const user = c.get('user');

   return c.json({
      id: user.id
   });
});
