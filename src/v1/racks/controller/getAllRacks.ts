import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';

export default new Hono().get('/', async (c) => {
   try {
      const racks = await prisma.rack.findMany({
         select: {
            id: true,
            name: true,
            size: true,
            notes: true
         }
      });

      return c.json(
         racks.map((rack) => ({
            id: rack.id,
            name: rack.name,
            size: rack.size,
            notes: rack.notes
         })),
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
