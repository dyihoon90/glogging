import clone from 'lodash/clone';

/**
 * Traverse the object deeply, calling callback on all properties that are not object
 * Arrays and objects are both considered object
 * Note: Mutates the obj passed in
 * @param obj
 * @param callback
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function traverseAndMutateObject(
  obj: Record<string | number | symbol, any>,
  callback: (key: string, value: any) => any
) {
  if (!obj) {
    return obj;
  }
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object') {
      obj[key] = traverseAndMutateObject(obj[key], callback);
    } else {
      obj[key] = callback(key, obj[key]);
    }
  });
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
      if (redactedProperties.includes(key) && typeof clonedObj === 'object') {
        clonedObj[key as any] = '[REDACTED]';
      }
      if (typeof clonedObj[key] === 'object') {
        clonedObj[key as any] = redactProperties(redactedProperties, clonedObj[key]);
      }
    });
  }
  return clonedObj;
}
