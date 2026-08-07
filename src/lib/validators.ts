import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { invalidBodyError, invalidParametersError, invalidQueryError } from './errorMessages';

const paramValidator = <T extends z.ZodTypeAny>(validator: T) =>
   zValidator('param', validator, (result, c) => {
      if (!result.success) {
         return invalidParametersError(c, result);
      }
   });

const bodyValidator = <T extends z.ZodTypeAny>(validator: T) =>
   zValidator('json', validator, (result, c) => {
      if (!result.success) {
         return invalidBodyError(c, result);
      }
   });

const queryValidator = <T extends z.ZodTypeAny>(validator: T) =>
   zValidator('query', validator, (result, c) => {
      if (!result.success) {
         return invalidQueryError(c, result);
      }
   });

const paginationQueryValidator = <T extends z.ZodRawShape>(extra: T = {} as T) => {
   return queryValidator(
      z.object({
         page: z.coerce
            .number({ error: 'Page must be a number' })
            .int({ error: 'Page must be an integer' })
            .positive({ error: 'Page must be 1 or greater' })
            .default(1),
         limit: z.coerce
            .number({ error: 'Limit must be a number' })
            .int({ error: 'Limit must be an integer' })
            .positive({ error: 'Limit must be greater than 0' })
            .default(25),
         ...extra
      })
   );
};

const searchQueryValidator = <T extends z.ZodRawShape>(extra: T = {} as T) => {
   return queryValidator(
      z.object({
         query: z.string({ error: 'Query must be a string' }).trim().optional(),
         page: z.coerce
            .number({ error: 'Page must be a number' })
            .int({ error: 'Page must be an integer' })
            .positive({ error: 'Page must be 1 or greater' })
            .default(1),
         limit: z.coerce
            .number({ error: 'Limit must be a number' })
            .int({ error: 'Limit must be an integer' })
            .positive({ error: 'Limit must be greater than 0' })
            .default(25),
         ...extra
      })
   );
};

const idParamValidator = <T extends z.ZodRawShape>(extra: T = {} as T) => {
   return paramValidator(
      z.object({
         id: z.coerce
            .number({ error: 'ID must be a number' })
            .int({ error: 'ID must be a whole number' })
            .positive({ error: 'ID must be greater than 0' }),
         ...extra
      })
   );
};

export {
   paramValidator,
   bodyValidator,
   queryValidator,
   paginationQueryValidator,
   searchQueryValidator,
   idParamValidator
};
