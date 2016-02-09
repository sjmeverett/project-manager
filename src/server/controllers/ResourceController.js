
import _ from 'lodash';
import * as web from 'express-decorators';
import {NotFoundError} from '../lib/errors';
import requireAll from 'require-all';


@web.controller('/resources')
export default class ResourceController {
  constructor() {
    this.resources = requireAll({
      dirname: __dirname + '/../resources',
      filter: /(.+)\.js$/,
      recursive: true
    });
  }


  @param('resource')
  resourceParam(request, response, next, resource) {
    request.resource = this.resources[resource];

    if (!request.resource) {
      throw new NotFoundError(`Unknown resource "${resource}"`);
    }

    next();
  }

  @web.get('/:resource')
  async retrieveResourcesAction(request, response) {
    let query = request.resource.Model;

    if (request.query.filter) {
      query = query.filter(_.mapValues(request.query.filter, JSON.parse));
    }

    if (request.query.fields && request.query.fields[request.param.resource]) {
      query = query.pluck(request.query.fields.spli(','));
    }

    if (request.query.sort) {
      let orderBy = {};
    }

    let resources = await request.resourceDescription.Model.run();
  }
};
