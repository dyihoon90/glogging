/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redactProperties, traverseAndMutateObject } from '../src/utils/ObjUtils';

describe('redactProperties', () => {
  describe('When empty array of properties is passed in', () => {
    it('should return a cloned object that is the same as the original', () => {
      const obj = { key1: 'a', key2: { key3: { key4: 'b' } } };

      const redacted = redactProperties([], obj);

      expect(redacted).toEqual(obj);
    });
  });
  describe('When redacting any object', () => {
    it('should not mutate the original', () => {
      const obj = { key1: 'a', key2: { key3: { key4: 'b' } } };
      const propsToRedact = ['key1', 'key3'];

      const redacted = redactProperties(propsToRedact, obj);

      expect(obj).toEqual({ key1: 'a', key2: { key3: { key4: 'b' } } });
      expect(redacted).toEqual({ key1: '[REDACTED]', key2: { key3: '[REDACTED]' } });
    });
  });
  describe('When passed in an Object', () => {
    it('should redact the correct properties', () => {
      const obj = { key1: 'a', key2: { key3: { key4: 'b' } } };
      const propsToRedact = ['key1', 'key3'];

      const redacted = redactProperties(propsToRedact, obj);

      expect(redacted).toEqual({ key1: '[REDACTED]', key2: { key3: '[REDACTED]' } });
    });
  });
  describe('When passed in an Array', () => {
    describe('When redacting values that are objects in the array', () => {
      it('should redact all reelvant object properties in the array', () => {
        const obj = [
          { key1: 'a', key2: 'x' },
          { key1: 'b', key2: 'y' },
          { key1: 'c', key2: 'z', key3: ' surprise' }
        ];
        const propsToRedact = ['key1', 'key3'];

        const redacted = redactProperties(propsToRedact, obj);

        expect(redacted).toEqual([
          { key1: '[REDACTED]', key2: 'x' },
          { key1: '[REDACTED]', key2: 'y' },
          { key1: '[REDACTED]', key2: 'z', key3: '[REDACTED]' }
        ]);
      });
    });
    describe('When redacting indexes in the array', () => {
      it('should redact the correct index of items in the array', () => {
        const obj = [
          { key1: 'a', key2: 'x' },
          { key1: 'b', key2: 'y' },
          { key1: 'c', key2: 'z' }
        ];
        const propsToRedact = [1, 'key1'];

        const redacted = redactProperties(propsToRedact, obj);

        expect(redacted).toEqual([
          { key1: '[REDACTED]', key2: 'x' },
          { key1: '[REDACTED]', key2: 'z' }
        ]);
      });
    });
  });
  describe('When redacting a property that does not exist', () => {
    it('should do nothing', () => {
      const obj = [
        { key1: 'a', key2: 'x' },
        { key1: 'b', key2: 'y' },
        { key1: 'c', key2: 'z' }
      ];
      const propsToRedact = ['nonexistentkey'];

      const redacted = redactProperties(propsToRedact, obj);

      expect(redacted).toEqual(obj);
    });
  });
});
describe('traverseAndMutateObject', () => {
  describe('Basic functionality', () => {
    it('should traverse and mutate a simple object', () => {
      const obj = { a: 1, b: 2 };
      const result = traverseAndMutateObject(obj, (_, value) => (typeof value === 'number' ? value + 1 : value));
      expect(result).toEqual({ a: 2, b: 3 });
    });

    it('should handle nested objects', () => {
      const obj = { a: 1, b: { c: 2, d: 3 } };
      const result = traverseAndMutateObject(obj, (_, value) => (typeof value === 'number' ? value * 2 : value));
      expect(result).toEqual({ a: 2, b: { c: 4, d: 6 } });
    });
  });

  describe('Depth limiting', () => {
    it('should respect the maximum depth', () => {
      const deepObj = { a: { b: { c: { d: 1 } } } };
      const result = traverseAndMutateObject(deepObj, (_, v) => v, 2);
      expect(result).toEqual({ a: { b: {} } });
    });

    it('should process at maximum depth but not beyond', () => {
      const deepObj = { a: { b: { c: 1 } } };
      const result = traverseAndMutateObject(deepObj, (_, v) => (typeof v === 'number' ? v + 1 : v), 3);
      expect(result).toEqual({ a: { b: { c: 2 } } });
    });
  });

  describe('Circular reference handling', () => {
    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.b = obj;
      const result = traverseAndMutateObject(obj, (_, v) => v);
      expect(result).toEqual({ a: 1, b: '[Circular]' });
    });
  });

  describe('Edge cases', () => {
    it('should handle null values', () => {
      const obj = { a: null, b: 2 };
      const result = traverseAndMutateObject(obj, (_, v) => (v === null ? 'was null' : v));
      expect(result).toEqual({ a: 'was null', b: 2 });
    });

    it('should handle undefined values', () => {
      const obj = { a: undefined, b: 2 };
      const result = traverseAndMutateObject(obj, (_, v) => (v === undefined ? 'was undefined' : v));
      expect(result).toEqual({ a: 'was undefined', b: 2 });
    });
  });
});
