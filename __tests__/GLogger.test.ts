import { format } from 'logform';
import { transports } from 'winston';
import { GLogger, IExpressRequest, IExpressResponse, LoggingMode } from '../src';

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
            metadata: {
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
            metadata: {
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
});

const token = {
  sub: 'test_user@t.g.sg',
  jti: '7e27866f-402c-4938-95c8-edf85e731b4a',
  iat: 1600665219,
  exp: 1608441219,
  iss: 'onemobileuserauthws.dwp.gov.sg',
  'appInstanceID.dwp.gov.sg': '1',
  'appID.dwp.gov.sg': 'oma-facade',
  'singpass_nric.dwp.gov.sg': 'S1234567A'
};

const req: Partial<IExpressRequest> = {
  reqStartTimeInEpochMillis: 1600939344000,
  ip: '123.111.222.333',
  headers: {
    'x-forwarded-for': '999.999.999.999'
  },
  url: 'test/test/aa',
  uuid: 'uuid-123',
  user: token,
  method: 'GET'
};
