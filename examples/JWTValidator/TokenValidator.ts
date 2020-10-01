import jwt from 'jsonwebtoken';
import { createPublicPEMFromXML } from './rsaXml';

export interface IPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
  iss: number;
  [key: string]: unknown;
}

export const DEFAULT_ALGORITHM = 'RS512';

interface IConfig {
  publicKeyXml: string;
}

interface IParams {
  publicKey: string;
}

interface IValidateOptions {
  issuer?: string | string[];
}

class TokenValidator {
  private static instance: TokenValidator;

  private publicKey: string;

  static async instantiate({ publicKeyXml }: IConfig): Promise<void> {
    if (!TokenValidator.instance) {
      let publicKey = '';
      try {
        publicKey = await createPublicPEMFromXML(publicKeyXml);
      } catch (err) {
        throw new Error(`Cannot create public key: ${err.message}`);
      }

      TokenValidator.instance = new TokenValidator({ publicKey });
    }
  }

  static getInstance(): TokenValidator {
    return TokenValidator.instance;
  }

  constructor({ publicKey = '' }: IParams) {
    this.publicKey = publicKey;
  }

  /**
   * Validate JWT token.
   *
   * @param token JWT token
   * @param options Options to augment validation process
   * @param options.issuer Will compare value against "iss" claim in token if defined
   */
  validate(token: string, options?: IValidateOptions): Promise<IPayload> {
    const key = this.publicKey;
    return new Promise((resolve, reject) => {
      jwt.verify(token, key, { issuer: options?.issuer }, (err, decoded) => {
        if (!err) {
          const payload = decoded as IPayload;
          resolve(payload);
        } else {
          reject(err);
        }
      });
    });
  }
}

export default TokenValidator;
