import { GLogger, IExpressRequest } from '.';
import { GLoggerAuditLogger } from './GLogger.auditLogger';

/**
 * #### Class decorator function that adds logging to all class methods
 * - All class methods must take in an IExpressRequest object (extended from express.Request) as first parameter
 * - Creates success audit log of level `info` on return
 * - Creates fail audit log of level `warn` on error thrown
 * - Modifies all class methods except the constructor method
 * - Arrow functions are _not_ considered class methods
 * @param logger a GLogger instance
 * @param trxModule the transaction module e.g. INBOX_CLAIM
 * @param filename the filename. In Node.js can use __filename (if not webpacked)
 */
export function LogTransactionsForAllMethods(logger: GLogger, trxModule: string, filename?: string) {
  return function (target: Function): void {
    for (const propertyName of Object.getOwnPropertyNames(target.prototype)) {
      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, propertyName)!;
      const isMethod = descriptor.value instanceof Function;
      if (!isMethod || propertyName === 'constructor') {
        continue;
      }

      const originalMethod: (...args: unknown[]) => unknown = descriptor.value;
      descriptor.value = (req: IExpressRequest, ...args: unknown[]): any => {
        return decorateFunctionWithLogs(logger, trxModule, originalMethod, propertyName, req, filename, ...args);
      };

      Object.defineProperty(target.prototype, propertyName, descriptor);
    }
  };
}

/**
 * #### decorator function that adds logging to a normal function / arrow function
 * - Function must take in an IExpressRequest object (extended from express.Request) as first parameter
 * - Creates success audit log of level `info` on return
 * - Creates fail audit log of level `warn` on error thrown
 * @param logger a GLogger instance
 * @param trxModule the transaction module e.g. INBOX_CLAIM
 * @param filename the filename. In Node.js can use __filename (if not webpacked)
 */
export function LogTransaction(logger: GLogger, trxModule: string, filename?: string) {
  return function <U extends unknown[], V>(
    decoratedFunc: (req: IExpressRequest, ...args: U) => V,
    req: IExpressRequest,
    ...args: U
  ): Promise<unknown> | V {
    return decorateFunctionWithLogs(logger, trxModule, decoratedFunc, decoratedFunc.name, req, filename, ...args);
  };
}

function decorateFunctionWithLogs<U extends unknown[], V>(
  logger: GLogger,
  trxModule: string,
  decoratedFunc: (req: IExpressRequest, ...args: U) => V,
  decoratedFuncName: string,
  req: IExpressRequest,
  filename?: string,
  ...args: U
): Promise<unknown> | V {
  const startTime = new Date().getTime();
  try {
    const auditLoggerInstance = new GLoggerAuditLogger(logger);
    const promiseOrValue = decoratedFunc(req, ...args);
    // Scenario where decoratedFunc is asynchronous returning Promise
    if (promiseOrValue instanceof Promise) {
      return promiseOrValue
        .then((result) => {
          auditLoggerInstance.logTransactionSuccess(
            `Transaction: ${decoratedFuncName} success`,
            { req },
            { filename, trxName: decoratedFuncName, trxModule },
            startTime
          );
          return result as unknown;
        })
        .catch((e) => {
          auditLoggerInstance.logTransactionFailure(
            e,
            { req },
            { filename, trxName: decoratedFuncName, trxModule },
            startTime
          );
          throw e;
        });
    }
    // Scenario where decoratedFunc is synchronous returning value
    // Why separate? if we `await` sync decoratedFunc, return value gets casted into Promise, becoming async
    auditLoggerInstance.logTransactionSuccess(
      `Transaction: ${decoratedFuncName} success`,
      { req },
      { filename, trxName: decoratedFuncName, trxModule },
      startTime
    );
    return promiseOrValue;
  } catch (e) {
    const auditLoggerInstance = new GLoggerAuditLogger(logger);
    auditLoggerInstance.logTransactionFailure(
      e,
      { req },
      { filename, trxName: decoratedFuncName, trxModule },
      startTime
    );
    throw e;
  }
}
