function getValueFromJson<T = unknown>(obj: unknown, path: string): T | undefined {
   let current: any = obj;

   for (const part of path.split('/')) {
      if (current == null) return undefined;

      const arrayMatch = part.match(/^\[(\d+)\]$/);

      if (arrayMatch) {
         if (!Array.isArray(current)) return undefined;
         current = current[Number(arrayMatch[1])];
      } else {
         if (typeof current !== 'object') return undefined;
         current = current[part];
      }
   }

   return current as T | undefined;
}

export { getValueFromJson };
