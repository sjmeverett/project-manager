
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Promise from 'promise';

export const pbkdf2 = Promise.denodeify(crypto.pbkdf2);
pbkdf2.ITERATIONS = 100000;
pbkdf2.KEYLEN = 512;
pbkdf2.ALGORITHM = 'sha512';

export function hashPassword(password, salt) {
  return pbkdf2(password, salt, pbkdf2.ITERATIONS, pbkdf2.KEYLEN, pbkdf2.ALGORITHM);
};

export const signjwt = Promise.denodeify(jwt.sign);
export const verifyjwt = Promise.denodeify(jwt.verify);
