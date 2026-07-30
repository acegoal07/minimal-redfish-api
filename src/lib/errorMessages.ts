import type { Context } from 'hono';

/**
 * Responds with a internal server error message
 * @param c
 * @param err
 * @returns
 */
function internalServerError(c: Context, err: unknown) {
   console.error(err);

   return c.json(
      {
         error: 'INTERNAL_SERVER_ERROR',
         message: 'An unexpected error occurred.'
      },
      500
   );
}

/**
 * Responds with an invalid parameters error message populated with the issues from
 * the validator
 * @param c
 * @param result
 * @returns
 */
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

/**
 * Responds with an invalid body error message populated with the issues from
 * the validator
 * @param c
 * @param result
 * @returns
 */
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

/**
 * Responds with a not found error message
 * @param c
 * @returns
 */
function notFoundError(c: Context) {
   return c.json(
      {
         error: 'NOT_FOUND',
         message: 'The requested resource does not exist.'
      },
      404
   );
}

/**
 * Responds with a not found error message
 * @param c
 * @returns
 */
function invalidJsonError(c: Context) {
   return c.json(
      {
         error: 'BAD_REQUEST',
         message: 'The JSON sent to the server was invalid.'
      },
      404
   );
}

export {
   internalServerError,
   invalidParametersError,
   invalidBodyError,
   notFoundError,
   invalidJsonError
};
