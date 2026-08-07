import type { Context } from 'hono';

/**
 * Retrieves the data from a JSON object using a path
 * @param obj
 * @param path
 * @returns The value at the path or null if not found
 */
function getValueFromJson<T = unknown>(obj: unknown, path: string): T | null {
   let current: any = obj;

   for (const part of path.split('/').filter(Boolean)) {
      if (current == null) return null;

      const arrayMatch = part.match(/^\[(\d+)\]$/);

      if (arrayMatch) {
         if (!Array.isArray(current)) return null;
         current = current[Number(arrayMatch[1])];
      } else {
         if (typeof current !== 'object') return null;
         current = current[part];
      }
   }

   if (
      current === null ||
      current === undefined ||
      typeof current === 'object' ||
      typeof current === 'function'
   ) {
      return null;
   }

   return current as T;
}

/**
 * Checks to see if a string can be made into valid json
 * @param value
 * @returns
 */
function isValidJson(value: string) {
   try {
      JSON.parse(value);
      return true;
   } catch {
      return false;
   }
}

/**
 * The permissions available
 */
type Permission =
   | 'template.read'
   | 'template.write'
   | 'template.delete'
   | 'user.create'
   | 'user.update'
   | 'user.delete'
   | 'role.create'
   | 'role.update'
   | 'role.delete'
   | 'tag.create'
   | 'tag.update'
   | 'tag.delete'
   | 'group.create'
   | 'group.update'
   | 'group.delete'
   | 'asset.create'
   | 'asset.update'
   | 'asset.delete';

/**
 * Checks whether the user has the required permissions
 * @param permissions
 * @param c
 * @returns
 */
function validatePermissions(permissions: Permission[], c: Context) {
   const user = c.get('user');

   return permissions.every((permission) =>
      user.role.permissions.map((permission) => permission.name).includes(permission)
   );
}

export { getValueFromJson, isValidJson, validatePermissions };
