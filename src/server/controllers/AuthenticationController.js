
import _ from 'lodash';
import bufferEq from 'buffer-equal-constant-time';
import crypto from '../lib/crypto';
import Joi from 'joi';
import {db, config} from '../index';
import {NotAuthorisedError, NotAuthenticatedError} from '../lib/errors';
import * as web from 'express-decorators';
import * as extra from '../lib/extra-decorators';
import * as auth from 'auth-header';

const users = db.table('users');


@web.controller('/')
export default class AuthenticationController {

  @web.post('/auth')
  @extra.validate(Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }))
  async authenticateAction(request, response) {
    let user = await users.getAll(request.data.email, {index: 'email'}).singleOrDefault();
    let hash;

    if (user) {
      hash = crypto.hashPassword(request.data.password, user.salt);
    }

    if (!user || !bufferEq(hash, user.passwordHash)) {
      throw new NotAuthenticatedError('Invalid email address or password');
    }

    let token = await crypto.signjwt(_.pick(user, ['id', 'sequence']), config.authSecret,
      {expiresIn: config.authExpires, issuer: config.authIssuer});

    response.json(token);
  }


  @web.use
  async middleware(request, response, next) {
    let header = auth.parse(request.get('authorization'));

    if (header.length === 1 && header[0].scheme === 'Bearer') {
      let str = new Buffer(header[0].token, 'base64').toString();

      try {
        let token = await verifyjwt(str, config.authSecret, {issuer: config.authIssuer});
        let user = await users.get(token.id);

        if (!user) {
          next(new NotAuthorisedError('invalid user ID'));
        } else if (user.sequence !== token.sequence) {
          next(new NotAuthorisedError('wrong sequence number'));
        } else {
          request.user = user;
          next();
        }

      } catch (e) {
        e.status = "403";
        next(err);
      }
    } else {
      next();
    }
  }
};
