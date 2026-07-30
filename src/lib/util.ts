/**
 * Retrieves the data from a json object using a path
 * @param obj
 * @param path
 * @returns
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

   return current as T | null;
}

export { getValueFromJson };
