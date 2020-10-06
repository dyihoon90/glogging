import { format } from 'logform';
import { transports } from 'winston';
import { GLogger, IExpressRequest, IReq, LoggingMode } from '../src';
import { LogTransaction } from '../src';

// EXAMPLE: INTIALIZING
const logger = new GLogger({ loggingMode: LoggingMode.LOCAL });

// EXAMPLE: ADDING NEW TRANSPORT
// const transport = new transports.Console({
//   format: format.combine(format.json())
// });
// logger.addLogTransport(transport)

// EXAMPLE: LOGGING NORMALLY
divider()
logger.info('info message 1',{myData: 'okay'});
divider()
// logger.warn('error message 1', new Error('more error messages'), {myOtherValues:'value1'});
divider()
// logger.error('error message 1', new Error('more error messages'),{myMetadata:"this is metadata"});
divider()
//EXAMPLE: SETUP
//@ts-ignore
const res: IExpressResponse = {
  statusCode: 200
};

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
divider()
// logger.logTransactionSuccess('this is a message',{req},{trxName: 'my transaction name',trxModule:"EXAMPLE_MODULE",filename:__filename},new Date().getTime())
divider()

//EXAMPLE: LOGGING TRANSACTIONS: LOGGING WITH DECORATOR
@LogTransaction(logger,'TRANSACTION_MODULE',__filename)
class TransactionModule {
  public transactionSucceded(request: IExpressRequest): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
  public async transactionFailedWithStringExample(request: IExpressRequest): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject('this is to test promise failure');
    await fakeAwaitFunction();
  }
  public async transactionFailedWithErrorExample(request: IExpressRequest): Promise<void> {
    const fakeAwaitFunction = () => Promise.reject(new Error('this is to test promise failure'));
    await fakeAwaitFunction();
  }

  /**
   * Bad example of transaction service swallowing the error when it shouldn't
   *
   * @param request
   */
  public async transactionFailedBadExample(request: IExpressRequest): Promise<void> {
    try{
      const fakeAwaitFunction = () => Promise.reject(new Error('this is to test promise failure'));
      await fakeAwaitFunction();
    }catch(e){
      // error swallowed without throwing
    }

  }
}
divider()
// new TransactionModule().transactionSucceded(req);
// new TransactionModule().transactionFailedWithStringExample(req);
new TransactionModule().transactionFailedWithErrorExample(req);
// new TransactionModule().transactionFailedBadExample(req);
divider()
//#endregion

function divider(){
  console.log('--------------------------------------------------------------------------------------------------------')
}
