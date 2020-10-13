import { format } from 'winston';
import { transports } from 'winston';
import {
  GLogger,
  GLoggerAuditLogger,
  IExpressRequest,
  LoggingMode,
  LoggedTransactionMethod,
  LoggedTransactionClass
} from '../src';
import { LoggedTransaction } from '../src';

// INTIALIZING
const logger = new GLogger({ loggingMode: LoggingMode.LOCAL });

//#region Setup
// ADDING NEW TRANSPORT
const transport = new transports.Console({
  format: format.combine(format.json())
});
// logger.addLogTransport(transport);
function divider(section?: string) {
  console.log(
    `\n--------------------------------------------------------${
      section ? section : ''
    }--------------------------------------------------------\n`
  );
}

function aSyncSuccessTransaction(request: IExpressRequest, obj: Record<string, any>): Record<string, any> {
  return obj;
}

const aSyncSuccessArrowTransaction = (request: IExpressRequest, str: string): string => {
  return str;
};

function aSyncFailTransaction(request: IExpressRequest, str: string): string {
  throw new Error(str);
}

class OtherClass {
  @LoggedTransactionMethod(logger, 'OtherClass', __filename, { toLogResults: true })
  public getSurname(request: IExpressRequest, str: string) {
    return 'surname' + str;
  }
}
@LoggedTransactionClass(logger, 'trxmodule', __filename, { toLogResults: true })
class TransactionModule {
  public greeting = 'hi';
  public otherClass = new OtherClass();

  /**
   * This example method is to illustrate the `this` binding for all scenarios work
   */
  public syncTransactionSucceded(request: IExpressRequest, str: string): string {
    return this.greeting + this.otherClass.getSurname(request, str) + this.anotherMethod(request, str);
  }
  public asyncTransactionSucceded = (request: IExpressRequest, str: string): Promise<string> => {
    return Promise.resolve(str);
  };
  public async asyncTransactionFailedWithStringExample(request: IExpressRequest): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject('this is to test promise failure');
    await fakeAwaitFunction();
  }
  public async transactionFailedWithErrorExample(request: IExpressRequest): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject(new Error('this is to test promise failure'));
    await fakeAwaitFunction();
  }

  public anotherMethod(request: IExpressRequest, str: string): string {
    return str;
  }

  /**
   * Bad example of transaction service swallowing the error when it shouldn't
   *
   * @param request
   */
  public async asyncTransactionFailedBadExample(request: IExpressRequest): Promise<void> {
    try {
      const fakeAwaitFunction = () => Promise.reject(new Error('this is to test promise failure'));
      await fakeAwaitFunction();
    } catch (e) {
      // error swallowed without throwing
    }
  }
}

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
  user: token
};
//#endregion

// EXAMPLE: BASIC LOG
divider('EXAMPLE: BASIC LOG');
logger.info('info message 1', { myData: 'okay' });
logger.warn('error message 1', new Error('more error messages'), { myMetadata: 'this is metadata' });
logger.error('error message 1', new Error('more error messages'), { myMetadata: 'this is metadata' });
divider('EXAMPLE: BASIC LOG END');

//EXAMPLE: LOGGING TRANSACTIONS: LOGGING WITHOUT DECORATOR
divider('LOGGING TRANSACTIONS');
new GLoggerAuditLogger(logger).logTransactionSuccess(
  'this is a message',
  { req: req as IExpressRequest },
  { trxName: 'my transaction name', trxModule: 'EXAMPLE_MODULE', filename: __filename },
  new Date().getTime()
);
divider('LOGGING TRANSACTIONS END');

//EXAMPLE: LOGGING TRANSACTIONS: LOGGING WITH DECORATOR
divider('LOGGING TRANSACTIONS WITH CLASS DECORATOR');
new TransactionModule().syncTransactionSucceded(req as IExpressRequest, 'success!');
new TransactionModule().asyncTransactionSucceded(req as IExpressRequest, 'success!');
new TransactionModule().asyncTransactionFailedWithStringExample(req as IExpressRequest);
new TransactionModule().asyncTransactionFailedBadExample(req as IExpressRequest);
divider('LOGGING TRANSACTIONS WITH CLASS DECORATOR END');

divider('LOGGING TRANSACTION WITH FUNCTION DECORATOR');
LoggedTransaction(logger, 'Test Transaction Module', __filename, { toLogResults: true })(
  aSyncSuccessTransaction,
  req as IExpressRequest,
  { myObj: { b: { c: 'S1234567A' } } }
);
LoggedTransaction(logger, 'Test Transaction Module', __filename, { toLogResults: true })(
  aSyncSuccessArrowTransaction,
  req as IExpressRequest,
  'resolved successfully'
);
try {
  LoggedTransaction(logger, 'Test Transaction Module', __filename)(
    aSyncFailTransaction,
    req as IExpressRequest,
    'met an error'
  );
} catch (e) {}
divider('LOGGING TRANSACTION WITH FUNCTION DECORATOR END');
