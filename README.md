![Release pipeline](https://github.com/dyihoon90/glogging/workflows/Release%20Package%20to%20NPM/badge.svg)
![CI pipeline](https://github.com/dyihoon90/glogging/workflows/Run%20CI%20per%20push%20to%20Github%20repo/badge.svg)

# Opiniated audit logger for Express HTTP & Transactions

### Installation

`npm i @dyihoon90/glogging`

### Description

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

## 2. Class decorator

Class decorator for logging success/failure of transactions to external systems, such as other APIs or DB calls.

With this decorator, **all** class methods will be decorated.

All class methods, other than the `constructor`, **MUST** take a param of type IExpressRequest as its first parameter.

This IExpressRequest will allow the logger to receive the context required to log the HTTP request this transaction is tied to.

See `domainModels/request.interface` for the shape of IExpressRequest.

Example of a function being decorated:

```typescript
@LogTransaction(logger,'TRANSACTION_MODULE_1','a.filename.ts')
class ATransationClass
  public  transactionSucceded(request: IExpressRequest): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
```
