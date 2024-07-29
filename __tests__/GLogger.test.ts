/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from 'winston';
import { transports } from 'winston';
import { __test__, GLogger, LoggingMode } from '../src';

class CustomError extends Error {
  metadata: string;
  constructor(msg: string, metadata: string) {
    super(msg);
    this.metadata = metadata;
  }
}

describe('Test GLogger', () => {
  let mockFn: () => any;
  let logger: GLogger;
  beforeEach(() => {
    mockFn = jest.fn();
    logger = new GLogger({ loggingMode: LoggingMode.LOCAL });
    logger.addLogTransport(new transports.Console({ format: format.printf(mockFn) }));
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('Test Redacting', () => {
    describe('When any of the object property contains `token` keyword', () => {
      it('should be redacted', () => {
        logger.info('msg', { a_session_tOkEN: 'my-secret-token' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({ a_session_tOkEN: '[REDACTED]', level: 'info', message: 'msg' })
        );
      });
    });
    describe('When any of the object property contains `secret` keyword', () => {
      it('should be redacted', () => {
        logger.info('msg', { a_sEcReT_value: 'my-secret-value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({ a_sEcReT_value: '[REDACTED]', level: 'info', message: 'msg' })
        );
      });
    });
    describe('When any of the object value looks like a Singapore NRIC', () => {
      it('should be redacted', () => {
        logger.info('msg', { nric: 'T1234567Z' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({ nric: '*****567Z', level: 'info', message: 'msg' })
        );
      });
    });
    describe('When key contains nric && value is an array', () => {
      it('should be redacted', () => {
        logger.info('msg', { myUsersNRICs: ['T1234567Z', 'S1234567Y'] });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            myUsersNRICs: '[REDACTED DUE TO NRIC OR UINFIN KEY]',
            level: 'info',
            message: 'msg'
          })
        );
      });
    });
    describe('When key contains uinfin && value is an array', () => {
      it('should be redacted', () => {
        logger.info('msg', { uinfinsOfUsers: ['T1234567Z', 'S1234567Y'] });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            uinfinsOfUsers: '[REDACTED DUE TO NRIC OR UINFIN KEY]',
            level: 'info',
            message: 'msg'
          })
        );
      });
    });

    describe('When values have been redacted', () => {
      it('should not mutate object that was passed in', () => {
        const objectToBeRedacted = { secret: 123, layer1: { nric: 'T1234567Z' } };

        logger.info('msg', objectToBeRedacted);

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            secret: '[REDACTED]',
            layer1: { nric: '*****567Z' },
            level: 'info',
            message: 'msg'
          })
        );
        expect(objectToBeRedacted.layer1.nric).toEqual('T1234567Z');
        expect(objectToBeRedacted.secret).toEqual(123);
      });
    });
  });
  describe('Test Debug log', () => {
    it('should call transport in the correct format', () => {
      logger.debug('msg', { data1: 'value' });

      expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ data1: 'value', level: 'debug', message: 'msg' }));
    });
  });
  describe('Test Info Log', () => {
    it('should call transport in the correct format', () => {
      logger.info('msg', { data1: 'value' });

      expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ data1: 'value', level: 'info', message: 'msg' }));
    });
  });
  describe('Test Warn Log', () => {
    describe('when error is defined', () => {
      it('should call transport in the correct format', () => {
        logger.warn('msg', new Error('error msg'), { data1: 'value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data1: 'value',
            level: 'warn',
            message: 'msg',
            additionalInfo: {
              error: expect.objectContaining({ message: 'error msg', name: 'Error', stack: expect.any(String) })
            }
          })
        );
      });
    });
    describe('when a custom Error class that extends Error is defined', () => {
      it('should call transport in the correct format', () => {
        logger.warn('msg', new CustomError('error msg', 'metadata'), { data1: 'value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data1: 'value',
            level: 'warn',
            message: 'msg',
            additionalInfo: {
              error: expect.objectContaining({
                message: 'error msg',
                name: 'Error',
                stack: expect.any(String),
                metadata: 'metadata'
              })
            }
          })
        );
      });
    });
    describe('When error is not defined', () => {
      test('should call transport in the correct format', () => {
        logger.warn('msg', undefined, { data1: 'value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data1: 'value',
            level: 'warn',
            message: 'msg'
          })
        );
      });
    });
  });
  describe('Test Error Log', () => {
    describe('when error is defined', () => {
      test('should call transport in the correct format', () => {
        logger.error('msg', new Error('error msg'), { data1: 'value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data1: 'value',
            level: 'error',
            message: 'msg',
            additionalInfo: {
              error: expect.objectContaining({ message: 'error msg', name: 'Error', stack: expect.any(String) })
            }
          })
        );
      });
    });
    describe('when a custom Error class that extends Error is defined', () => {
      test('should call transport in the correct format', () => {
        logger.error('msg', new CustomError('error msg', 'metadata'), { data1: 'value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data1: 'value',
            level: 'error',
            message: 'msg',
            additionalInfo: {
              error: expect.objectContaining({
                message: 'error msg',
                name: 'Error',
                stack: expect.any(String),
                metadata: 'metadata'
              })
            }
          })
        );
      });
    });
    describe('When error is not defined', () => {
      test('should call transport in the correct format', () => {
        logger.error('msg', undefined, { data1: 'value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data1: 'value',
            level: 'error',
            message: 'msg'
          })
        );
      });
    });
  });
  describe('Test Logging Levels', () => {
    afterEach(jest.clearAllMocks);
    it('should call winston .debug method if Logging mode is LOCAL', () => {
      mockFn = jest.fn();
      const testLogger = new GLogger({ loggingMode: LoggingMode.LOCAL });
      testLogger.addLogTransport(new transports.Console({ format: format.printf(mockFn) }));

      testLogger.debug('msg');

      expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ level: 'debug', message: 'msg' }));
    });

    it('should not call winston .debug method if Logging mode is DEV', () => {
      mockFn = jest.fn();
      const testLogger = new GLogger({ loggingMode: LoggingMode.DEV });
      testLogger.addLogTransport(new transports.Console({ format: format.printf(mockFn) }));

      testLogger.debug('msg');

      expect(mockFn).not.toHaveBeenCalledWith(expect.objectContaining({ level: 'debug', message: 'msg' }));
    });

    it('should not call winston .debug method if Logging mode is PRODUCTION', () => {
      mockFn = jest.fn();
      const testLogger = new GLogger({ loggingMode: LoggingMode.PRODUCTION });
      testLogger.addLogTransport(new transports.Console({ format: format.printf(mockFn) }));

      testLogger.debug('msg');

      expect(mockFn).not.toHaveBeenCalledWith(expect.objectContaining({ level: 'debug', message: 'msg' }));
    });
  });
  describe('Test circular object in logs', () => {
    it('should log successfully without throwing error', () => {
      const circularObj: { circularRef?: any; list?: any } = {};
      circularObj.circularRef = circularObj;
      circularObj.list = [circularObj, circularObj];
      const circularStr = __test__.formatWithLinebreakAndIndent(circularObj);
      expect(circularStr).toEqual(`{
 "circularRef": "[Circular ~]",
 "list": [
  "[Circular ~]",
  "[Circular ~]"
 ]
}`);
    });
  });
  describe('Test logging complex objects', () => {
    describe('when logging objects with circular references', () => {
      it('should call transport with serialized circular object', () => {
        interface ICircularObject {
          name: string;
          self?: ICircularObject;
          nested?: {
            circular?: ICircularObject;
          };
        }

        const circularObj: ICircularObject = {
          name: 'Circular Object'
        };
        circularObj.self = circularObj;
        circularObj.nested = { circular: circularObj };

        logger.info('Logging circular object', circularObj);

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 'info',
            message: 'Logging circular object',
            name: 'Circular Object',
            self: { name: 'Circular Object', nested: { circular: '[Circular]' }, self: '[Circular]' },
            nested: {
              circular: '[Circular]'
            }
          })
        );
      });
    });
    describe('when error has circular references', () => {
      it('should call transport with serialized circular error', () => {
        interface ICircularError extends Error {
          circular?: ICircularError;
        }

        const circularError: ICircularError = new Error('Circular error');
        circularError.circular = circularError;

        logger.warn('Circular error occurred', circularError, { data1: 'value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data1: 'value',
            level: 'warn',
            message: 'Circular error occurred',
            additionalInfo: {
              error: expect.objectContaining({
                message: 'Circular error',
                name: 'Error',
                stack: expect.any(String),
                circular: '[Circular]'
              })
            }
          })
        );
      });
    });

    describe('when error has nested errors', () => {
      it('should call transport with serialized nested errors', () => {
        const nestedError = new Error('Nested error');
        const parentError = new Error('Parent error');
        parentError.cause = nestedError;

        logger.warn('Nested error occurred', parentError, { data1: 'value' });

        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data1: 'value',
            level: 'warn',
            message: 'Nested error occurred',
            additionalInfo: {
              error: expect.objectContaining({
                message: 'Parent error',
                name: 'Error',
                stack: expect.any(String),
                cause: expect.objectContaining({
                  message: 'Nested error',
                  name: 'Error',
                  stack: expect.any(String)
                })
              })
            }
          })
        );
      });
    });
  });
});
