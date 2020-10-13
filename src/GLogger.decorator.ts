/* eslint-disable @typescript-eslint/no-unsafe-return */
import { GLogger, IExpressRequest, ITransactionLoggingOptions } from '.';
import { IDecoratorMetadata } from './domainModels';
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
export function LoggedClass(
  logger: GLogger,
  metadata: IDecoratorMetadata,
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
          LoggedMethod(logger, metadata, options)(target, propertyName as string, descriptor) as any
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
export function LoggedMethod(
  logger: GLogger,
  metadata: IDecoratorMetadata,
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
          return decorateFunctionWithLogs(logger, metadata, originalMethod.bind(this), key, req, options, ...args);
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
export function LoggedFunction(logger: GLogger, metadata: IDecoratorMetadata, options?: ITransactionLoggingOptions) {
  return function <U extends unknown[], V>(
    decoratedFunc: (req: IExpressRequest, ...args: U) => V,
    req: IExpressRequest,
    ...args: U
  ): Promise<unknown> | V {
    return decorateFunctionWithLogs(logger, metadata, decoratedFunc, decoratedFunc.name, req, options, ...args);
  };
}

function decorateFunctionWithLogs<U extends unknown[], V>(
  logger: GLogger,
  { trxCategory, trxModule, filename }: IDecoratorMetadata,
  decoratedFunc: (req: IExpressRequest, ...args: U) => V,
  decoratedFuncName: string | symbol,
  req: IExpressRequest,
  options?: ITransactionLoggingOptions,
  ...args: U
): Promise<unknown> | V {
  const startTime = new Date().getTime();
  const fnName = String(decoratedFuncName);
  const auditLoggerInstance = new GLoggerAuditLogger(logger);
  const logFailure = auditLoggerInstance.logTransactionFailure.bind(
    auditLoggerInstance,
    { req },
    { trxCategory, filename, trxName: fnName, trxModule },
    startTime
  );
  try {
    const promiseOrValue = decoratedFunc(req, ...args);
    const opt = { ...DEFAULT_OPTIONS, ...options };
    const logSuccess = auditLoggerInstance.logTransactionSuccess.bind(
      auditLoggerInstance,
      `Transaction: ${fnName} success`,
      { req },
      { trxCategory, filename, trxName: fnName, trxModule },
      startTime
    );

    // Scenario where decoratedFunc is asynchronous returning Promise
    if (promiseOrValue instanceof Promise) {
      return promiseOrValue
        .then((result) => {
          if (opt.toLogResults) {
            logSuccess(result);
          } else {
            logSuccess();
          }
          return result as unknown;
        })
        .catch((e) => {
          logFailure(e);
          throw e;
        });
    }
    // Scenario where decoratedFunc is synchronous returning value
    // Why separate? if we `await` sync decoratedFunc, return value gets casted into Promise, becoming async
    if (opt.toLogResults) {
      logSuccess(promiseOrValue);
    } else {
      logSuccess();
    }
    return promiseOrValue;
  } catch (e) {
    logFailure(e);
    throw e;
  }
}
