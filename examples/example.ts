import { format } from 'logform';
import { transports } from 'winston';
import { GLogger, IExpressRequest, IExpressResponse, IReqRes, LoggingMode } from '../src';
import { LogTransaction } from '../src';

const response: IExpressResponse = {
  statusCode: 200
};

const token = {
  sub: 'jocelyn_ng@tech.gov.sg',
  jti: '7e27866f-402c-4938-95c8-edf85e731b4a',
  iat: 1600665219,
  exp: 1608441219,
  iss: 'onemobileuserauthws.dwp.gov.sg',
  'appInstanceID.dwp.gov.sg': '1',
  'appID.dwp.gov.sg': 'oma-facade',
  'singpass_nric.dwp.gov.sg': 'S2805507B'
};

const request: IExpressRequest = {
  reqStartTimeInEpochMillis: 1600939344000,
  ip: '123.111.222.333',
  headers: {
    'x-forwarded-for': '999.999.999.999'
  },
  url: 'test/test/aa',
  uuid: 'uuid-123',
  user: token
};

// logHttpSuccess('test', meta, 'TrxName1', token);
// logHttpFailure(new Error('errror!'), { req: request, res: response }, 'TrxName1', token);
const transport = new transports.Console({
  format: format.combine(format.json())
});
const logger = new GLogger({ loggingMode: LoggingMode.LOCAL });
// logger.info('info message 1');
// logUtil.addTransport(transport);

// logger.logHttpSuccess('test', { req: request, res: response }, { trxModule: 'HRP', trxName: 'GET_LEAVE_DETAILS' });
// auditLogger.logHttpFailure(new Error('errror!'), { req: request, res: response }, 'TrxName1', token);
// auditLogger.logTransactionSuccess('test', { req: request, res: response }, 'trxName1', token, 1600939344000);
// auditLogger.logTransactionFailure(
//   new Error('errror!'),
//   { req: request, res: response },
//   'trxName2',
//   token,
//   1600939344000
// );

class TestClass {
  @LogTransaction(logger, 'TEST_CLASS')
  testSuccessTransaction({ req, res }: IReqRes): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
  @LogTransaction(logger, 'TEST_CLASS')
  async testFailureStringTransaction({ req, res }: IReqRes): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject('this is to test promise failure');
    await fakeAwaitFunction();
  }
  @LogTransaction(logger, 'TEST_CLASS')
  async testFailureErrorTransaction({ req, res }: IReqRes): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject(new Error('this is to test promise failure'));
    await fakeAwaitFunction();
  }
}

// new TestClass().testSuccessTransaction({ req: request, res: response });
// new TestClass().testFailureStringTransaction({ req: request, res: response });
new TestClass().testFailureErrorTransaction({ req: request, res: response });
