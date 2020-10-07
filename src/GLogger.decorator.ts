import { GLogger, IExpressRequest } from '.';
import { GLoggerAuditLogger } from './GLogger.auditLogger';

/**
 * Class decorator function that adds logging to all class methods
 * All class methods must take in an IExpressRequest (an extended express.Request) object as first parameter
 * This modifies all class methods except the constructor method, adding logging on successful complete or on error
 * @param logger a GLogger instance
 * @param trxModule the transaction module e.g. INBOX_CLAIM
 * @param filename the filename. In Node.js can use __filename (if not webpacked)
 */
export function LogTransaction(logger: GLogger, trxModule: string, filename?: string) {
  return function <TResult>(target: Function): void {
    for (const propertyName of Object.getOwnPropertyNames(target.prototype)) {
      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, propertyName)!;
      const isMethod = descriptor.value instanceof Function;
      if (!isMethod || propertyName === 'constructor') {
        continue;
      }

      const originalMethod = descriptor.value;
      descriptor.value = async (req: IExpressRequest, ...args: any[]) => {
        const startTime = new Date().getTime();
        try {
          const result = await originalMethod(req, ...args);
          const auditLoggerInstance = new GLoggerAuditLogger(logger);
          auditLoggerInstance.logTransactionSuccess(
            `Transaction: ${propertyName} success`,
            { req },
            { filename, trxName: propertyName, trxModule },
            startTime
          );
          return result as TResult;
        } catch (e) {
          const auditLoggerInstance = new GLoggerAuditLogger(logger);
          auditLoggerInstance.logTransactionFailure(
            e,
            { req },
            { filename, trxName: propertyName, trxModule },
            startTime
          );
          throw e;
        }
      };

      Object.defineProperty(target.prototype, propertyName, descriptor);
    }
  };
}
