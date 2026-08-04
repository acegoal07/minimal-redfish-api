import { Hono } from 'hono';

import { prisma } from '../../../lib/prisma';
import { forbiddenError, internalServerError } from '../../../lib/errorMessages';
import { validatePermissions } from '../../../lib/util';

export default new Hono().get('/', async (c) => {
   try {
      // Check users permissions
      if (!validatePermissions(['rack.read'], c)) {
         return forbiddenError(c);
      }

      // Get all the racks
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
