import { clone, forIn, isPlainObject } from 'lodash';

/**
 * Traverse the object deeply, calling callback on all properties that are not object
 * Arrays and objects are both considered object
 * Removes circular references
 * Note: Mutates the obj passed in
 * @param obj
 * @param callback
 * @param seen Set of already seen objects (used for circular reference detection)
 * @returns
 */
export function traverseAndMutateObject(
  obj: Record<string | symbol, any>,
  callback: (key: string, value: any) => any,
  seen: Set<any> = new Set()
): Record<string | symbol, any> {
  if (!obj) {
    return obj;
  }

  // If we've seen this object before, it's a circular reference
  if (seen.has(obj)) {
    return '[Circular]' as any;
  }

  // Add this object to the set of seen objects
  seen.add(obj);

  forIn(obj, (value, key) => {
    if (isPlainObject(value)) {
      obj[key] = traverseAndMutateObject(value, callback, seen);
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
        (clonedObj as any)[key] = '[REDACTED]';
      } else if (typeof clonedObj[key] === 'object' && clonedObj[key] !== null) {
        (clonedObj as any)[key] = redactProperties(redactedProperties, clonedObj[key]);
      }
    });
  }
  return clonedObj;
}
