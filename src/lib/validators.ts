import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { invalidParametersError } from './errorMessages';

const idParamValidator = zValidator(
   'param',
   z.object({
      id: z.coerce
         .number({ error: 'ID must be a number' })
         .int({ error: 'ID must be a whole number' })
         .positive({ error: 'ID must be greater than 0' })
   }),
   (result, c) => {
      if (!result.success) {
         return invalidParametersError(c, result);
      }
   }
);

export { idParamValidator };
