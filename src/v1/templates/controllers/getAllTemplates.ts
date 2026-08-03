import { Hono } from 'hono';
import { prisma } from '../../../lib/prisma';
import { internalServerError } from '../../../lib/errorMessages';

export default new Hono().get('/', async (c) => {
   try {
      const templates = await prisma.template.findMany({
         include: {
            templatePaths: true
         }
      });

      return c.json(
         templates.map((template) => ({
            id: template.id,
            name: template.name,
            paths: template.templatePaths.map((path) => ({
               id: path.id,
               name: path.name,
               path: path.path
            }))
         })),
         200
      );
   } catch (err) {
      return internalServerError(c, err);
   }
});
