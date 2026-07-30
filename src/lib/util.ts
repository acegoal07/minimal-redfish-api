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

   return current ?? null;
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

export { getValueFromJson, isValidJson };
