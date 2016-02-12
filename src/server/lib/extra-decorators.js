
import {middleware} from 'express-decorators';


export function validate(schema) {
  return middleware(function (request, response, next) {
    let validation = Joi.validate(request.body, schema);

    if (validation.error) {
      validation.error.status = "400"
      next(validation.error);
    } else {
      request.data = validation.value;
      next();
    }
  });
};
