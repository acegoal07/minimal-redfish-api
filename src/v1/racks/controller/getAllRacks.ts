import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';

export default new Hono().get('/', async (c) => {
   try {
      const racks = await prisma.rack.findMany();

      return c.json(racks, 200);
   } catch (err) {
      return internalServerError(c, err);
   }
});
