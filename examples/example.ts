import { format } from 'winston';
import { transports } from 'winston';
import { GLogger, GLoggerAuditLogger, IExpressRequest, IReq, LoggingMode, LogTransactionsForAllMethods } from '../src';
import { LogTransaction } from '../src';

// EXAMPLE: INTIALIZING
const logger = new GLogger({ loggingMode: LoggingMode.LOCAL });

// EXAMPLE: ADDING NEW TRANSPORT
const transport = new transports.Console({
  format: format.combine(format.json())
});
// logger.addLogTransport(transport);

// EXAMPLE: BASIC LOG
divider('EXAMPLE: BASIC LOG');
logger.info('info message 1', { myData: 'okay' });
logger.warn('error message 1', new Error('more error messages'), { myOtherValues: 'value1' });
logger.error('error message 1', new Error('more error messages'), { myMetadata: 'this is metadata' });
divider('EXAMPLE: BASIC LOG END');

//EXAMPLE: SETUP
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

//#region EXAMPLE: LOGGING TRANSACTIONS

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
@LogTransactionsForAllMethods(logger, 'TRANSACTION_MODULE', __filename)
class TransactionModule {
  /**
   * This example method is to illustrate the `this` binding of all class methods are okay
   */
  public async asyncTransactionSucceded(request: IExpressRequest, str: string): Promise<string> {
    return await this.anotherClassMethod(request, str);
  }
  public syncTransactionSucceded(request: IExpressRequest, str: string): string {
    return str;
  }
  public async asyncTransactionFailedWithStringExample(request: IExpressRequest): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject('this is to test promise failure');
    await fakeAwaitFunction();
  }
  public async transactionFailedWithErrorExample(request: IExpressRequest): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject(new Error('this is to test promise failure'));
    await fakeAwaitFunction();
  }

  public anotherClassMethod(request: IExpressRequest, str: string): Promise<string> {
    return Promise.resolve(str);
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
divider('LOGGING TRANSACTIONS WITH CLASS DECORATOR');
new TransactionModule().asyncTransactionSucceded(req as IExpressRequest, 'success!');
new TransactionModule().syncTransactionSucceded(req as IExpressRequest, 'success!');
new TransactionModule().asyncTransactionFailedWithStringExample(req as IExpressRequest);
new TransactionModule().asyncTransactionFailedBadExample(req as IExpressRequest);
divider('LOGGING TRANSACTIONS WITH CLASS DECORATOR END');
//#endregion

function aSyncSuccessTransaction(request: IExpressRequest, str: string): string {
  return str;
}

const aSyncSuccessArrowTransaction = (request: IExpressRequest, str: string): string => {
  return str;
};

function aSyncFailTransaction(request: IExpressRequest, str: string): string {
  throw new Error(str);
}

divider('LOGGING TRANSACTION WITH FUNCTION DECORATOR');
LogTransaction(logger, 'Test Transaction Module', __filename)(
  aSyncSuccessTransaction,
  req as IExpressRequest,
  'resolved successfully'
);
LogTransaction(logger, 'Test Transaction Module', __filename)(
  aSyncSuccessArrowTransaction,
  req as IExpressRequest,
  'resolved successfully'
);
try {
  LogTransaction(logger, 'Test Transaction Module', __filename)(
    aSyncFailTransaction,
    req as IExpressRequest,
    'met an error'
  );
} catch (e) {}
divider('LOGGING TRANSACTION WITH FUNCTION DECORATOR END');

function divider(section?: string) {
  console.log(
    `\n--------------------------------------------------------${
      section ? section : ''
    }--------------------------------------------------------\n`
  );
}
