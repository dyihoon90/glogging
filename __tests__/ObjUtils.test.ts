import { redactProperties } from '../src/utils/ObjUtils';

describe('redactProperties', () => {
  describe('When redacting any object', () => {
    it('should not mutate the original', () => {
      const obj = { key1: 'a', key2: { key3: { key4: 'b' } } };
      const propsToRedact = ['key1', 'key3'];

      const redacted = redactProperties(propsToRedact, obj);

      expect(obj).toEqual({ key1: 'a', key2: { key3: { key4: 'b' } } });
      expect(redacted).toEqual({ key2: {} });
    });
  });
  describe('When passed in an Object', () => {
    it('should redact the correct properties', () => {
      const obj = { key1: 'a', key2: { key3: { key4: 'b' } } };
      const propsToRedact = ['key1', 'key3'];

      const redacted = redactProperties(propsToRedact, obj);

      expect(redacted).toEqual({ key2: {} });
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

        expect(redacted).toEqual([{ key2: 'x' }, { key2: 'y' }, { key2: 'z' }]);
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

        expect(redacted).toEqual([{ key2: 'x' }, { key2: 'z' }]);
      });
    });
  });
});
