import type { Context } from 'hono';

function internalServerError(c: Context, err: unknown) {
   console.error(err);

   return c.json(
      {
         success: false,
         error: 'INTERNAL_SERVER_ERROR',
         message: 'An unexpected error occurred.'
      },
      500
   );
}

function invalidParametersError(c: Context, result: { error: { issues: unknown[] } }) {
   return c.json(
      {
         error: 'INVALID_PARAMETERS',
         message: 'One or more request parameters are invalid.',
         details: result.error.issues
      },
      400
   );
}

function invalidBodyError(c: Context, result: { error: { issues: unknown[] } }) {
   return c.json(
      {
         error: 'INVALID_BODY',
         message: 'One or more request fields are invalid.',
         details: result.error.issues
      },
      400
   );
}

function notFoundError(c: Context) {
   return c.json(
      {
         success: false,
         error: 'NOT_FOUND',
         message: 'The requested resource does not exist.'
      },
      404
   );
}

export { internalServerError, invalidParametersError, invalidBodyError, notFoundError };
