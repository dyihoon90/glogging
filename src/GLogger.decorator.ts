import { GLogger, IExpressRequest } from '.';

/**
 * Decorator function for logging transaction.
 * @param loggerInstance a GLogger instance
 * @param trxModule the transaction module e.g. DWP
 * @param filename the filename. In Node.js can use __filename (if not webpacked)
 */
export function LogTransaction(loggerInstance: GLogger,  trxModule: string, filename?: string) {
  return function <TResult>(_: any, methodName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    // value is the class method being wrapped by this decorator
    const originalMethod = descriptor.value;
    descriptor.value = async function (req: IExpressRequest, ...args: []) {
      const startTime = new Date().getTime();
      try {
        const result = await originalMethod.apply(this, [req, ...args]);
        loggerInstance.logTransactionSuccess(`Transaction: ${methodName} success`, {req}, { filename, trxName: methodName, trxModule }, startTime);
        return result as TResult;
      } catch (e) {
        loggerInstance.logTransactionFailure(e, {req}, { filename, trxName: methodName, trxModule }, startTime);
        throw e;
      }
    };
    return descriptor;
  };
}
