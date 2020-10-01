# Opiniated audit logger for Express HTTP & Transactions

This library builds on winston to provide a GLogger class to

This library includes a few things:

1. Express middlewares

Express middleware for logging HTTP success and response

2. Function decorators

Function decorators for logging transaction success and response

The function being decorated MUST take a param of type IReq as its first parameter for the logger to work as intended

See request.interface.ts for the shape of IReq.

Example of a function being decorated:

```typescript
  public  transactionSucceded({ req }: IReq): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
```

I have detailed example usage for this library.

Run `npm run example` to see normal and transaction function decorator examples

Run `npm run example-server` to create an example express server and see middleware examples
