import _ from 'lodash';

export function traverseObject(obj: Record<string | number | symbol, any>, callback: (valueToBeRedacted: any) => any) {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object') {
      obj[key] = traverseObject(obj[key], callback);
    } else {
      obj[key] = callback(obj[key]);
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
  const clonedObj = _.clone(obj);
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
        delete clonedObj[key];
      }
      if (typeof clonedObj[key] === 'object') {
        clonedObj[key as any] = redactProperties(redactedProperties, clonedObj[key]);
      }
    });
  }
  return clonedObj;
}
