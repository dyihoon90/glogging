/* eslint-disable @typescript-eslint/no-unsafe-return */
import { GLogger, IExpressRequest, ITransactionLoggingOptions } from '.';
import { GLoggerAuditLogger } from './GLogger.auditLogger';

const DEFAULT_OPTIONS: ITransactionLoggingOptions = {
  toLogResults: false
};

/**
 * #### Class decorator function that adds logging to all class methods
 * - All class methods _must_ take in an IExpressRequest object (extended from express.Request) as first parameter
 * - Creates success audit log of level `info` on return
 * - Creates fail audit log of level `warn` on error thrown
 * - Modifies all class methods except the constructor method
 * - Arrow functions are _not_ considered class methods
 * @param logger a GLogger instance
 * @param trxModule the transaction module e.g. INBOX_CLAIM
 * @param filename the filename. In Node.js can use __filename (if not webpacked)
 */
export function LoggedTransactionClass(
  logger: GLogger,
  trxModule: string,
  filename?: string,
  options?: ITransactionLoggingOptions
): ClassDecorator {
  return function (target) {
    for (const propertyName of Reflect.ownKeys(target.prototype)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target.prototype, propertyName);
      const isMethod = descriptor?.value instanceof Function;
      if (!isMethod || propertyName === 'constructor') {
        continue;
      }
      if (typeof descriptor?.value === 'function') {
        Object.defineProperty(
          target.prototype,
          propertyName,
          LoggedTransactionMethod(
            logger,
            trxModule,
            filename,
            options
          )(target, propertyName as string, descriptor) as any
        );
      }
      // Object.defineProperty(target.prototype, propertyName, descriptor);
    }
  };
}

/**
 * #### Method decorator function that adds logging to method
 * - Methods _must_ take in an IExpressRequest object (extended from express.Request) as first parameter
 * - Creates success audit log of level `info` on return
 * - Creates fail audit log of level `warn` on error thrown
 * - Modifies all class methods except the constructor method
 * - Arrow functions are _not_ considered class methods
 * @param logger a GLogger instance
 * @param trxModule the transaction module e.g. INBOX_CLAIM
 * @param filename the filename. In Node.js can use __filename (if not webpacked)
 * @returns a function that takes in boolean, whether to log the results of the function or not
 */
export function LoggedTransactionMethod(
  logger: GLogger,
  trxModule: string,
  filename?: string,
  options?: ITransactionLoggingOptions
): MethodDecorator {
  return function (target: any, key, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new TypeError(
        `@LogTransactionMethod decorator can only be applied to methods not: ${typeof originalMethod}`
      );
    }
    return {
      configurable: false,
      get() {
        if (this === target.prototype || typeof originalMethod !== 'function') {
          return originalMethod;
        }
        descriptor.value = (req: IExpressRequest, ...args: unknown[]) => {
          return decorateFunctionWithLogs(
            logger,
            trxModule,
            originalMethod.bind(this),
            key,
            req,
            filename,
            options,
            ...args
          );
        };
        const boundFn = descriptor.value;
        return boundFn;
      },
      set(value) {
        descriptor.value = value;
      }
    };
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
 * @param
 */
export function LoggedTransaction(
  logger: GLogger,
  trxModule: string,
  filename?: string,
  options?: ITransactionLoggingOptions
) {
  return function <U extends unknown[], V>(
    decoratedFunc: (req: IExpressRequest, ...args: U) => V,
    req: IExpressRequest,
    ...args: U
  ): Promise<unknown> | V {
    return decorateFunctionWithLogs(
      logger,
      trxModule,
      decoratedFunc,
      decoratedFunc.name,
      req,
      filename,
      options,
      ...args
    );
  };
}

function decorateFunctionWithLogs<U extends unknown[], V>(
  logger: GLogger,
  trxModule: string,
  decoratedFunc: (req: IExpressRequest, ...args: U) => V,
  decoratedFuncName: string | symbol,
  req: IExpressRequest,
  filename?: string,
  options?: ITransactionLoggingOptions,
  ...args: U
): Promise<unknown> | V {
  const startTime = new Date().getTime();
  const fnName = String(decoratedFuncName);
  try {
    const auditLoggerInstance = new GLoggerAuditLogger(logger);
    const promiseOrValue = decoratedFunc(req, ...args);
    const opt = { ...DEFAULT_OPTIONS, ...options };
    // Scenario where decoratedFunc is asynchronous returning Promise
    if (promiseOrValue instanceof Promise) {
      return promiseOrValue
        .then((result) => {
          if (opt.toLogResults) {
            auditLoggerInstance.logTransactionSuccess(
              `Transaction: ${fnName} success`,
              { req },
              { filename, trxName: fnName, trxModule },
              startTime,
              result
            );
          } else {
            auditLoggerInstance.logTransactionSuccess(
              `Transaction: ${fnName} success`,
              { req },
              { filename, trxName: fnName, trxModule },
              startTime
            );
          }
          return result as unknown;
        })
        .catch((e) => {
          auditLoggerInstance.logTransactionFailure(e, { req }, { filename, trxName: fnName, trxModule }, startTime);
          throw e;
        });
    }
    // Scenario where decoratedFunc is synchronous returning value
    // Why separate? if we `await` sync decoratedFunc, return value gets casted into Promise, becoming async
    if (opt.toLogResults) {
      auditLoggerInstance.logTransactionSuccess(
        `Transaction: ${fnName} success`,
        { req },
        { filename, trxName: fnName, trxModule },
        startTime,
        promiseOrValue
      );
    } else {
      auditLoggerInstance.logTransactionSuccess(
        `Transaction: ${fnName} success`,
        { req },
        { filename, trxName: fnName, trxModule },
        startTime
      );
    }
    return promiseOrValue;
  } catch (e) {
    const auditLoggerInstance = new GLoggerAuditLogger(logger);
    auditLoggerInstance.logTransactionFailure(e, { req }, { filename, trxName: fnName, trxModule }, startTime);
    throw e;
  }
}
