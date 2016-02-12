
import Joi from 'joi';


export const schema = Joi.object().keys({
  id: Joi.string(),
  key: Joi.string(),
  parent: Joi.string(),
  description: Joi.string()
});
