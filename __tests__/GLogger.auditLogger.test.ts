import { format } from 'logform';
import { transports } from 'winston';
import { GLogger, IExpressRequest, IExpressResponse, LoggingMode } from '../dist';
import { GLoggerAuditLogger } from '../dist/GLogger.auditLogger';

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
  describe('Test logHttpSuccess', () => {
    test('should call transport in the correct format', () => {
      const successRes: Partial<IExpressResponse> = {
        statusCode: 200
      };
      const auditLogger = new GLoggerAuditLogger(logger);
      auditLogger.logHttpSuccess(
        'msg',
        { req: req as IExpressRequest, res: successRes as IExpressResponse },
        { trxName: 'trans name', trxModule: 'trans module', filename: 'file/name.ts' }
      );

      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'file/name.ts',
          level: 'info',
          message: 'msg',
          additionalInfo: { method: 'GET', srcIp: '999.999.999.999', statusCode: 200, url: 'test/test/aa' },
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'HTTP',
          trxId: 'uuid-123',
          trxModule: 'trans module',
          trxName: 'trans name',
          trxStatus: 'SUCCESS',
          userToken: {
            'appID.dwp.gov.sg': 'oma-facade',
            'appInstanceID.dwp.gov.sg': '1',
            exp: 1608441219,
            iat: 1600665219,
            iss: 'onemobileuserauthws.dwp.gov.sg',
            jti: '7e27866f-402c-4938-95c8-edf85e731b4a',
            'singpass_nric.dwp.gov.sg': '*****567A',
            sub: 'test_user@t.g.sg'
          }
        })
      );
    });
  });
  describe('Test logHttpFailure', () => {
    test('should call transport in the correct format', () => {
      const failureRes: Partial<IExpressResponse> = {
        statusCode: 400
      };
      const auditLogger = new GLoggerAuditLogger(logger);
      auditLogger.logHttpFailure(
        new Error('error msg'),
        { req: req as IExpressRequest, res: failureRes as IExpressResponse },
        { trxName: 'trans name', trxModule: 'trans module', filename: 'file/name.ts' }
      );

      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'file/name.ts',
          level: 'warn',
          message: 'Error',
          additionalInfo: {
            method: 'GET',
            srcIp: '999.999.999.999',
            statusCode: 400,
            url: 'test/test/aa',
            error: { message: 'error msg', name: 'Error', stack: expect.any(String) }
          },
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'HTTP',
          trxId: 'uuid-123',
          trxModule: 'trans module',
          trxName: 'trans name',
          trxStatus: 'FAILURE',
          userToken: {
            'appID.dwp.gov.sg': 'oma-facade',
            'appInstanceID.dwp.gov.sg': '1',
            exp: 1608441219,
            iat: 1600665219,
            iss: 'onemobileuserauthws.dwp.gov.sg',
            jti: '7e27866f-402c-4938-95c8-edf85e731b4a',
            'singpass_nric.dwp.gov.sg': '*****567A',
            sub: 'test_user@t.g.sg'
          }
        })
      );
    });
  });
  describe('Test logTransactionSuccess', () => {
    test('should call transport in the correct format', () => {
      const auditLogger = new GLoggerAuditLogger(logger);
      auditLogger.logTransactionSuccess(
        'msg',
        { req: req as IExpressRequest },
        { trxName: 'trans name', trxModule: 'trans module', filename: 'file/name.ts' },
        1600665219
      );

      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'file/name.ts',
          level: 'info',
          message: 'msg',
          additionalInfo: { method: 'GET', url: 'test/test/aa' },
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'TRANS',
          trxId: 'uuid-123',
          trxModule: 'trans module',
          trxName: 'trans name',
          trxStatus: 'SUCCESS',
          userToken: {
            'appID.dwp.gov.sg': 'oma-facade',
            'appInstanceID.dwp.gov.sg': '1',
            exp: 1608441219,
            iat: 1600665219,
            iss: 'onemobileuserauthws.dwp.gov.sg',
            jti: '7e27866f-402c-4938-95c8-edf85e731b4a',
            'singpass_nric.dwp.gov.sg': '*****567A',
            sub: 'test_user@t.g.sg'
          }
        })
      );
    });
  });
  describe('Test logTransactionFailure', () => {
    test('should call transport in the correct format', () => {
      const auditLogger = new GLoggerAuditLogger(logger);
      auditLogger.logTransactionFailure(
        new Error('error msg'),
        { req: req as IExpressRequest },
        { trxName: 'trans name', trxModule: 'trans module', filename: 'file/name.ts' },
        1600665219
      );

      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'file/name.ts',
          level: 'warn',
          message: 'error msg',
          additionalInfo: {
            method: 'GET',
            url: 'test/test/aa',
            error: { message: 'error msg', name: 'Error', stack: expect.any(String) }
          },
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'TRANS',
          trxId: 'uuid-123',
          trxModule: 'trans module',
          trxName: 'trans name',
          trxStatus: 'FAILURE',
          userToken: {
            'appID.dwp.gov.sg': 'oma-facade',
            'appInstanceID.dwp.gov.sg': '1',
            exp: 1608441219,
            iat: 1600665219,
            iss: 'onemobileuserauthws.dwp.gov.sg',
            jti: '7e27866f-402c-4938-95c8-edf85e731b4a',
            'singpass_nric.dwp.gov.sg': '*****567A',
            sub: 'test_user@t.g.sg'
          }
        })
      );
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
