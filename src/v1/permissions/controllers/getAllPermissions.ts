import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';

export default new Hono().get('/', async (c) => {
   try {
      // Get all the templates
      const permissions = await prisma.permission.findMany();

      return c.json(
         permissions.map((permission) => ({
            id: permission.id,
            name: permission.name
         })),
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
