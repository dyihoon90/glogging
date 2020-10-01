import { parseStringPromise } from 'xml2js';
import NodeRSA from 'node-rsa';
import fs from 'fs';

interface IParsedXMLContent {
  RSAKeyValue: {
    Modulus: string;
    Exponent: string;
    P?: string;
    Q?: string;
    DP?: string;
    DQ?: string;
    InverseQ?: string;
    D?: string;
  };
  [key: string]: unknown;
}

const makeBufferFrom = (str: string): Buffer => Buffer.from(str, 'base64');

export const readContentFromXML = async (str: string): Promise<IParsedXMLContent> => {
  const obj = await parseStringPromise(str);

  if (
    !obj?.RSAKeyValue?.Modulus ||
    !obj?.RSAKeyValue?.Exponent ||
    !obj.RSAKeyValue.Modulus.length ||
    !obj.RSAKeyValue.Exponent.length
  ) {
    throw new Error('Invalid XML');
  }

  return {
    RSAKeyValue: {
      Modulus: obj.RSAKeyValue.Modulus[0],
      Exponent: obj.RSAKeyValue.Exponent[0],
      P: obj.RSAKeyValue.P?.[0],
      Q: obj.RSAKeyValue.Q?.[0],
      DP: obj.RSAKeyValue.DP?.[0],
      DQ: obj.RSAKeyValue.DQ?.[0],
      InverseQ: obj.RSAKeyValue.InverseQ?.[0],
      D: obj.RSAKeyValue.D?.[0]
    }
  };
};

export const createPrivateKey = ({ RSAKeyValue }: IParsedXMLContent): NodeRSA => {
  const key = new NodeRSA();
  key.importKey(
    {
      n: makeBufferFrom(RSAKeyValue.Modulus),
      e: makeBufferFrom(RSAKeyValue.Exponent),
      d: RSAKeyValue.D ? makeBufferFrom(RSAKeyValue.D) : undefined,
      p: RSAKeyValue.P ? makeBufferFrom(RSAKeyValue.P) : undefined,
      q: RSAKeyValue.Q ? makeBufferFrom(RSAKeyValue.Q) : undefined,
      dmp1: RSAKeyValue.DP ? makeBufferFrom(RSAKeyValue.DP) : undefined,
      dmq1: RSAKeyValue.DQ ? makeBufferFrom(RSAKeyValue.DQ) : undefined,
      coeff: RSAKeyValue.InverseQ ? makeBufferFrom(RSAKeyValue.InverseQ) : undefined
    },
    'components'
  );
  return key;
};

export const createPublicKey = ({ RSAKeyValue }: IParsedXMLContent): NodeRSA => {
  const key = new NodeRSA();
  key.importKey(
    {
      n: makeBufferFrom(RSAKeyValue.Modulus),
      e: makeBufferFrom(RSAKeyValue.Exponent)
    },
    'components-public'
  );
  return key;
};

export const createPrivatePEMFromXML = async (path: string): Promise<string> => {
  const parsed = await readContentFromXML(path);
  const privateKey = createPrivateKey(parsed);
  return privateKey.exportKey('pkcs8-private');
};

export const createPublicPEMFromXML = async (path: string): Promise<string> => {
  const parsed = await readContentFromXML(path);
  const publicKey = createPublicKey(parsed);
  return publicKey.exportKey('pkcs8-public');
};
