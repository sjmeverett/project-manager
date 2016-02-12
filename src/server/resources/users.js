
import Joi from 'joi';

export const schema = Joi.object().keys({
  id: Joi.string(),
  name: Joi.string(),
  email: Joi.string().email(),
  password: Joi.binary(),
  roles: Joi.array().items(Joi.string().valid('user')),
  sequence: Joi.number().integer()
});
