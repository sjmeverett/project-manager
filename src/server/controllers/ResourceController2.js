
import Serialiser from 'serialise2jsonapi';
import * as web from 'express-decorators';

@web.controller('/resources')
export default class ResourceController {

  @web.param('resource')
  resourceParam(request, response, next, resource) {
    request.resource = this.resources[resource];

    if (!request.resource) {
      next(NotFoundError(`Unknown resource "${resource}"`));

    } else {
      request.resource.table = db.table(resource);
      response.baseUrl = `${request.protocol}://${request.header('host')}/resources`;
      response.jsonapi = jsonapiResponse;
      response.jsonapiCreated = jsonapiCreated;

      next();
    }
  }


  @web.use
  middleware(request, response, next) {

  }
};


function jsonapiResponse(data, links) {
  let response = new Serialiser(this.baseUrl, 'id').serialise(resource, data, links);

  this
    .set('Content-Type', 'application/vnd.api+json')
    .json(response);
}


function jsonapiCreated(data, links) {
  let response = new Serialiser(this.baseUrl, 'id').serialise(resource, data, links);

  this
    .set('Content-Type', 'application/vnd.api+json')
    .set('Location', response.links.self)
    .status(201)
    .json(response);
}
