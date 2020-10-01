# Opiniated audit logger for Express HTTP & Transactions

### Installation

`npm i @dyihoon90/glogging`

This library builds on winston to provide a GLogger class to do logging for:

1. requests in express
2. logging for transactions to external systems in express

There are 3 modes:

### LOCAL
- defaults to have transport for console.
- Log level up to debug
### DEV
- Defaults to have transport for console.
- Log level up to info
### PRODUCTION
- Defaults to have no transport at all. Use logger.addTransport to add a winston log transport
- Log level up to info

### EXAMPLES

For example usage of this library, clone this library, do `npm i`, then:

Run `npm run example` to see normal and transaction function decorator examples

Run `npm run example-server` to create an example express server and see middleware examples


This library includes a few things:

## 1. Express middlewares

Express middleware for logging HTTP success and response

## 2. Function decorators

Function decorators for logging transaction success and response

The function being decorated MUST take a param of type IReq as its first parameter for the logger to work as intended

See `src/domainModels/request.interface.ts` for the shape of IReq.

Example of a function being decorated:

```typescript
  public  transactionSucceded({ req }: IReq): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
```
