
import Joi from 'joi';

export const schema = Joi.object().keys({
  id: Joi.string(),
  key: Joi.string(),
  description: Joi.string(),
  status: Joi.string(),
  date: Joi.date(),
  add: Joi.array().items(Joi.object().keys({
    key: Joi.string(),
    parent: Joi.string(),
    description: Joi.string()
  })),
  remove: Joi.array().items(Joi.string()),
  modify: Joi.array().items(Joi.object().keys({
    id: Joi.string(),
    description: Joi.string()
  }))
});
