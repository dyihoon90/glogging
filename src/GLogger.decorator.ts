import { GLogger, IReq } from '.';

/**
 * Class method decorator for logging requests in controller
 * @param method HTTP REST API method e.g. GET, POST
 * @param module module that logging is applied to e.g. Inbox
 */
export function LogTransaction(loggerInstance: GLogger,  trxModule: string, filename?: string) {
  return function <TResult>(_: any, methodName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    // value is the class method being wrapped by this decorator
    const originalMethod = descriptor.value;
    descriptor.value = async function (req: IReq, ...args: []) {
      const startTime = new Date().getTime();
      try {
        const result = await originalMethod.apply(this, [req, ...args]);
        loggerInstance.logTransactionSuccess(`Transaction: ${methodName} success`, req, { filename, trxName: methodName, trxModule }, startTime);
        return result as TResult;
      } catch (e) {
        loggerInstance.logTransactionFailure(e, req, { filename, trxName: methodName, trxModule }, startTime);
        throw e;
      }
    };
    return descriptor;
  };
}
