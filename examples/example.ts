import { format } from 'logform';
import { transports } from 'winston';
import { GLogger, IReq, LoggingMode } from '../src';
import { LogTransaction } from '../src';

// EXAMPLE: INTIALIZING
const logger = new GLogger({ loggingMode: LoggingMode.LOCAL });

// EXAMPLE: ADDING NEW TRANSPORT
// const transport = new transports.Console({
//   format: format.combine(format.json())
// });
// logger.addLogTransport(transport)

// EXAMPLE: LOGGING NORMALLY
logger.info('info message 1');

//EXAMPLE: SETUP
//@ts-ignore
const res: IExpressResponse = {
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

//@ts-ignore
const req: IExpressRequest = {
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
logger.logTransactionSuccess('this is a message',{req},{trxName: 'my transaction name',trxModule:"EXAMPLE_MODULE",filename:__filename},new Date().getTime())


//EXAMPLE: LOGGING TRANSACTIONS: LOGGING WITH DECORATOR
const LogTransactionWithContext = LogTransaction(logger,'TRANSACTION_MODULE',__filename)

class TransactionModule {
  @LogTransactionWithContext
  public transactionSucceded({ req }: IReq): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
  @LogTransactionWithContext
  public async transactionFailedWithStringExample({ req }: IReq): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject('this is to test promise failure');
    await fakeAwaitFunction();
  }
  @LogTransactionWithContext
  public async transactionFailedWithErrorExample({ req }: IReq): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject(new Error('this is to test promise failure'));
    await fakeAwaitFunction();
  }

  @LogTransactionWithContext
  public async transactionFailedBadExample({ req }: IReq): Promise<void> {
    try{
      const fakeAwaitFunction = () => Promise.reject(new Error('this is to test promise failure'));
      await fakeAwaitFunction();
    }catch(e){
      // error swallowed without throwing
    }

  }
}

new TransactionModule().transactionSucceded({ req: req });
new TransactionModule().transactionFailedWithStringExample({ req: req });
new TransactionModule().transactionFailedWithErrorExample({ req: req });
new TransactionModule().transactionFailedBadExample({ req: req });
//#endregion
