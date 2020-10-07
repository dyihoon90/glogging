import { enhanceReqWithTransactionAndTime, IExpressRequest, IExpressResponse, LoggingMode } from '../src';
import { GLogger } from '../src/GLogger';
const mockWarn = jest.fn();
const mockInfo = jest.fn();
jest.mock('../src/GLogger', () => {
  return {
    GLogger: jest.fn().mockImplementation(() => {
      return {
        addLogTransport: jest.fn(),
        warn: mockWarn,
        info: mockInfo
      };
    })
  };
});

describe('Test GLogger express middleware', () => {
  let mockNextFn: () => any;
  let logger: GLogger;
  beforeAll(() => {
    mockNextFn = jest.fn();
    logger = new GLogger({ loggingMode: LoggingMode.LOCAL });
  });
  afterEach(jest.resetAllMocks);
  describe('enhanceReqWithTransactionAndTime', () => {
    test('should work', () => {
      const req: Partial<IExpressRequest> = {
        ip: '123.111.222.333',
        headers: {
          'x-forwarded-for': '999.999.999.999'
        },
        url: 'test/test/aa',
        method: 'GET'
      };

      enhanceReqWithTransactionAndTime(req as IExpressRequest, res as IExpressResponse, mockNextFn);

      expect(req.reqStartTimeInEpochMillis).toBeDefined();
      expect(req.uuid).toBeDefined();
      expect(mockNextFn).toHaveBeenNthCalledWith(1);
    });
  });
});

const res: Partial<IExpressResponse> = {
  statusCode: 200
};
