import { clone, forIn } from 'lodash';

/**
 * Traverse the object deeply, calling callback on all properties that are not object
 * Arrays and objects are both considered object
 * Removes circular references
 * Limits the traversal depth to prevent excessive recursion
 * Note: Mutates the obj passed in
 * @param obj The object to traverse and mutate
 * @param callback Function to call on each non-object property
 * @param maxDepth Maximum depth to traverse (default: 100)
 * @param currentDepth Current depth of traversal (used internally)
 * @param seen Set of already seen objects (used for circular reference detection)
 * @returns The mutated object
 */
export function traverseAndMutateObject(
  obj: Record<string | symbol, unknown>,
  callback: (key: string, value: unknown) => unknown,
  maxDepth: number = 5,
  currentDepth: number = 0,
  seen: Set<unknown> = new Set()
): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // If we've reached the maximum depth, stop traversing
  if (currentDepth >= maxDepth) {
    return {} as unknown;
  }

  // If we've seen this object before, it's a circular reference
  if (seen.has(obj)) {
    return '[Circular]' as unknown;
  }

  // Add this object to the set of seen objects
  seen.add(obj);

  forIn(obj, (value, key) => {
    if (isPlainObject(value)) {
      obj[key] = traverseAndMutateObject(value, callback, maxDepth, currentDepth + 1, seen);
    } else {
      obj[key] = callback(key, value);
    }
  });

  // Remove this object from the set of seen objects
  seen.delete(obj);

  return obj;
}

/**
 * Remove from obj, all properties list redactedProperties.
 * Recursively remove from nested properties as well
 * @param redactedProperties
 * @param clonedObj
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function redactProperties<T extends Record<string | number | symbol, any>>(
  redactedProperties: Array<string | number | symbol>,
  obj: T
): T {
  const clonedObj = clone(obj);
  if (!redactedProperties || redactProperties.length === 0 || !obj) {
    return clonedObj;
  }
  if (Array.isArray(clonedObj)) {
    clonedObj.forEach((_value, index) => {
      if (redactedProperties.includes(index)) {
        clonedObj.splice(index, 1);
      }
      if (typeof clonedObj[index] === 'object') {
        clonedObj[index] = redactProperties(redactedProperties, clonedObj[index]);
      }
    });
  } else {
    Object.keys(clonedObj).forEach((key) => {
      if (redactedProperties.includes(key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (clonedObj as any)[key] = '[REDACTED]';
      } else if (typeof clonedObj[key] === 'object' && clonedObj[key] !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (clonedObj as any)[key] = redactProperties(redactedProperties, clonedObj[key]);
      }
    });
  }
  return clonedObj;
}

/**
 * Checks if the given value is a plain object.
 * A plain object is an object created by the Object constructor or one with a [[Prototype]] of null.
 *
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export function isPlainObject(value: unknown): value is Record<string | symbol, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}
