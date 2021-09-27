import { format } from 'winston';
import { transports } from 'winston';
import { GLogger, LoggingMode } from '../src';

describe('Test GLogger', () => {
  let mockFn: () => any;
  let logger: GLogger;
  beforeAll(() => {
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
    test('should call transport in the correct format', () => {
      logger.debug('msg', { data1: 'value' });

      expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ data1: 'value', level: 'debug', message: 'msg' }));
    });
  });
  describe('Test Info Log', () => {
    test('should call transport in the correct format', () => {
      logger.info('msg', { data1: 'value' });

      expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ data1: 'value', level: 'info', message: 'msg' }));
    });
  });
  describe('Test Warn Log', () => {
    describe('when error is defined', () => {
      test('should call transport in the correct format', () => {
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
});
