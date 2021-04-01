import { redactProperties } from '../src/utils/ObjUtils';

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
