import { LoggingMode, LoggedFunction, LoggedClass, IExpressRequest, TransactionCategory } from '../src';
import { GLogger } from '../src/GLogger';

const mockWarn = jest.fn();
const mockInfo = jest.fn();
jest.mock('../src/GLogger', () => {
  return {
    GLogger: jest.fn().mockImplementation(() => {
      return { warn: mockWarn, info: mockInfo };
    })
  };
});

const logger = new GLogger({ loggingMode: LoggingMode.LOCAL });
@LoggedClass(
  logger,
  { trxModule: 'TestModule', trxCategory: TransactionCategory.TRANS, filename: __filename },
  { toLogResults: true }
)
class TestClass {
  syncSuccessMethod(str: string): string {
    return str;
  }
  syncFailureMethod(str: string): string {
    throw new Error(str);
  }
  asyncSuccessMethod(str: string): Promise<string> {
    return Promise.resolve(str);
  }
  asyncFailureMethod(str: string): Promise<string> {
    return Promise.reject(str);
  }
  async asyncAwaitFailureMethod(str: string): Promise<string> {
    const a = (): Promise<string> => {
      return Promise.reject(str);
    };
    return await a();
  }
  async asyncAwaitFailureMethodWithError(str: string): Promise<string> {
    const a = (): Promise<string> => {
      return Promise.reject(new Error(str));
    };
    return await a();
  }
}

describe('LoggedClass', () => {
  afterEach(jest.resetAllMocks);
  describe('When a synchronous method is decorated', () => {
    it('should remain a synchronous method', () => {
      const testClass = new TestClass();
      const result = testClass.syncSuccessMethod('test');
      expect(result).toEqual('test');
    });
  });
  describe('When an asynchronous method is decorated', () => {
    it('should remain an asynchronous method', (done) => {
      const testClass = new TestClass();
      expect.assertions(1);
      testClass.asyncSuccessMethod('test').then((result) => {
        expect(result).toEqual('test');
        done();
      });
    });
  });
  describe('When a sync method that returns a value is decorated', () => {
    it('should call logger.info', () => {
      const testClass = new TestClass();
      expect.assertions(1);
      testClass.syncSuccessMethod('test');
      expect(mockInfo).toHaveBeenNthCalledWith(1, 'Transaction: syncSuccessMethod success', {
        additionalInfo: { method: undefined, url: undefined, result: 'test' },
        filename: expect.any(String),
        timeTakenInMillis: expect.any(Number),
        trxCategory: 'TRANS',
        trxId: 'missing trxId in req',
        trxModule: 'TestModule',
        trxName: 'syncSuccessMethod',
        trxStatus: 'SUCCESS'
      });
    });
  });

  describe('When a sync method that throws error is decorated', () => {
    it('should call logger.warn', (done) => {
      const testClass = new TestClass();
      expect.assertions(1);
      try {
        testClass.syncFailureMethod('test');
      } catch (e) {
        expect(mockWarn).toHaveBeenNthCalledWith(1, 'test', expect.any(Error), {
          additionalInfo: { method: undefined, url: undefined },
          filename: expect.any(String),
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'TRANS',
          trxId: 'missing trxId in req',
          trxModule: 'TestModule',
          trxName: 'syncFailureMethod',
          trxStatus: 'FAILURE'
        });
        done();
      }
    });
  });
  describe('When an async method that returns resolved Promise is decorated', () => {
    it('should call logger.info', (done) => {
      const testClass = new TestClass();
      expect.assertions(1);
      testClass.asyncSuccessMethod('test').then(() => {
        expect(mockInfo).toHaveBeenNthCalledWith(1, 'Transaction: asyncSuccessMethod success', {
          additionalInfo: { method: undefined, url: undefined, result: 'test' },
          filename: expect.any(String),
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'TRANS',
          trxId: 'missing trxId in req',
          trxModule: 'TestModule',
          trxName: 'asyncSuccessMethod',
          trxStatus: 'SUCCESS'
        });
        done();
      });
    });
  });
  describe('When a method that returns rejected Promise is decorated', () => {
    it('should call logger.warn', (done) => {
      const testClass = new TestClass();
      expect.assertions(1);
      testClass.asyncFailureMethod('test').catch(() => {
        expect(mockWarn).toHaveBeenNthCalledWith(1, 'test', undefined, {
          additionalInfo: { method: undefined, url: undefined },
          filename: expect.any(String),
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'TRANS',
          trxId: 'missing trxId in req',
          trxModule: 'TestModule',
          trxName: 'asyncFailureMethod',
          trxStatus: 'FAILURE'
        });
        done();
      });
    });
  });
  describe('When an async await method that rejects with a string is decorated', () => {
    it('should call logger.warn', (done) => {
      const testClass = new TestClass();
      expect.assertions(1);
      testClass.asyncAwaitFailureMethod('test').catch((e) => {
        expect(mockWarn).toHaveBeenNthCalledWith(1, 'test', undefined, {
          additionalInfo: { method: undefined, url: undefined },
          filename: expect.any(String),
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'TRANS',
          trxId: 'missing trxId in req',
          trxModule: 'TestModule',
          trxName: 'asyncAwaitFailureMethod',
          trxStatus: 'FAILURE'
        });
        done();
      });
    });
  });
  describe('When an async await method that reejcts with an error is decorated', () => {
    it('should call logger.warn', (done) => {
      const testClass = new TestClass();
      expect.assertions(1);
      testClass.asyncAwaitFailureMethodWithError('test').catch((e) => {
        expect(mockWarn).toHaveBeenNthCalledWith(1, 'test', expect.any(Error), {
          additionalInfo: { method: undefined, url: undefined },
          filename: expect.any(String),
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'TRANS',
          trxId: 'missing trxId in req',
          trxModule: 'TestModule',
          trxName: 'asyncAwaitFailureMethodWithError',
          trxStatus: 'FAILURE'
        });
        done();
      });
    });
  });
});

describe('LoggedFunction', () => {
  afterEach(jest.resetAllMocks);
  describe('When decorating a synchronous function', () => {
    it('should remain a synchronous function', () => {
      const syncFunc = (req: IExpressRequest, x: string) => x;

      const result = LoggedFunction(logger, { trxModule: 'test_module', trxCategory: TransactionCategory.TRANS })(
        syncFunc,
        {} as IExpressRequest,
        'test'
      );

      expect(result).toEqual('test');
    });
  });
  describe('When decorating an asynchronous function', () => {
    it('should remain an asynchronous function', () => {
      const syncFunc = (req: IExpressRequest, x: string) => x;

      const result = LoggedFunction(logger, { trxModule: 'test_module', trxCategory: TransactionCategory.TRANS })(
        syncFunc,
        {} as IExpressRequest,
        'test'
      );

      expect(result).toEqual('test');
    });
  });
  describe('When decorating a function and opt.toLogResult is set to true', () => {
    it('should log the result', () => {
      const syncFunc = (req: IExpressRequest, x: string) => x;

      LoggedFunction(
        logger,
        { trxModule: 'test_module', trxCategory: TransactionCategory.TRANS, filename: __filename },
        { toLogResults: true }
      )(syncFunc, {} as IExpressRequest, 'test');

      expect(mockInfo).toHaveBeenNthCalledWith(1, 'Transaction: syncFunc success', {
        additionalInfo: { method: undefined, url: undefined, result: 'test' },
        filename: expect.any(String),
        timeTakenInMillis: expect.any(Number),
        trxCategory: 'TRANS',
        trxId: 'missing trxId in req',
        trxModule: 'test_module',
        trxName: 'syncFunc',
        trxStatus: 'SUCCESS'
      });
    });
    describe('When opt.redactedProperties is also defined', () => {
      it('should log redacted', () => {
        const syncFunc = (req: IExpressRequest, x: Object) => x;

        LoggedFunction(
          logger,
          { trxModule: 'test_module', trxCategory: TransactionCategory.TRANS, filename: __filename },
          { toLogResults: true, redactedProperties: ['key1', 0] }
        )(syncFunc, {} as IExpressRequest, [
          { key1: 'a', key2: 'b' },
          { key1: 'c', key2: 'd' }
        ]);

        expect(mockInfo).toHaveBeenNthCalledWith(1, 'Transaction: syncFunc success', {
          additionalInfo: { method: undefined, url: undefined, result: [{ key1: '[REDACTED]', key2: 'd' }] },
          filename: expect.any(String),
          timeTakenInMillis: expect.any(Number),
          trxCategory: 'TRANS',
          trxId: 'missing trxId in req',
          trxModule: 'test_module',
          trxName: 'syncFunc',
          trxStatus: 'SUCCESS'
        });
      });
    });
  });
  describe('When decorating a function and toLogResult is set to the default false value', () => {
    it('should not log the result', () => {
      const syncFunc = (req: IExpressRequest, x: string) => x;

      LoggedFunction(logger, {
        trxModule: 'test_module',
        trxCategory: TransactionCategory.TRANS,
        filename: __filename
      })(syncFunc, {} as IExpressRequest, 'test');

      expect(mockInfo).toHaveBeenNthCalledWith(1, 'Transaction: syncFunc success', {
        additionalInfo: { method: undefined, url: undefined },
        filename: expect.any(String),
        timeTakenInMillis: expect.any(Number),
        trxCategory: 'TRANS',
        trxId: 'missing trxId in req',
        trxModule: 'test_module',
        trxName: 'syncFunc',
        trxStatus: 'SUCCESS'
      });
    });
  });
});
