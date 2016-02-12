
import _ from 'lodash';
import * as web from 'express-decorators';
import {app, config, db} from '../index.js';
import {NotFoundError, ConflictError, BadRequestError} from '../lib/errors';
import {r} from 'rethink-plus';
import Joi from 'joi';
import requireAll from 'require-all';
import Serialiser from 'serialise2jsonapi';


const defaultPageSize = 100;


@web.controller('/resources')
export default class ResourceController {
  constructor() {
    this.resources = requireAll({
      dirname: __dirname + '/../resources',
      filter: /(.+)\.js$/,
      recursive: true
    });
  }


  getSerialiser(request) {
    let baseUrl = `${request.protocol}://${request.header('host')}/resources`;
    return new Serialiser(baseUrl, 'id');
  }


  @web.get('/:resource')
  async retrieveResourcesAction(request, response) {
    let table = applyFilter(request, request.resource.table);
    table = applySort(request, table);
    table = applyProjection(request, table);

    let {limit, offset, links} = getPaging(request, await table.count());
    let resources = await table.skip(offset).limit(limit).toArray();

    response.jsonapi(resources, links);
  }


  @web.get('/:resource/:id')
  async retrieveResourceAction(request, response) {
    let resource = await request.resource.table.get(request.params.id);

    if (!resource) {
      throw new NotFoundError(`Resource '${request.params.resource}/${request.params.id}' not found`);
    }

    response.jsonapi(resource);
  }


  @web.post('/:resource')
  @web.middleware('validateMiddleware')
  async createAction(request, response) {
    let data = request.data;

    if (request.body.data.id)
      data.id = request.body.data.id;

    try {
      let serialiser = this.getSerialiser(request);
      let result = await request.resource.table.insert(data);

      if (result.generated_keys.length) {
        data.id = result.generated_keys[0];
      }

      let responseObj = serialiser.serialise(request.params.resource, data);

      response
        .status(201)
        .set('Location', responseObj.links.self)
        .set('Content-Type', 'application/vnd.api+json')
        .json(responseObj);

    } catch (err) {
      if (err.name === 'DuplicatePrimaryKeyError') {
        throw new ConflictError(`the specified id '${data.id}' is already in use`);

      } else {
        throw err;
      }
    }
  }


  @web.patch('/:resource/:id')
  @web.middleware('validateMiddleware')
  async updateAction(request, response) {
    let data = request.data;

    if (request.body.data.id !== request.params.id)
      throw new ConflictError(`'data.id' must equal '${request.params.id}', not '${data.id}'`);

    let result = await request.resource.table.get(request.params.id).update(data);

    if (result.skipped)
      throw new NotFoundError(`Resource '${request.params.resource}/${request.params.id}' not found`);

    response
      .status(204)
      .send();
  }


  @web.delete('/:resource/:id')
  async deleteAction(request, response) {
    let result = await request.resource.table.get(request.params.id).delete();

    if (!result.deleted)
      throw new NotFoundError(`Resource '${request.params.resource}/${request.params.id}' not found`);

    response
      .status(204)
      .send();
  }


  @web.param('resource')
  resourceParam(request, response, next, resource) {
    request.resource = this.resources[resource];

    if (!request.resource) {
      throw new NotFoundError(`Unknown resource "${resource}"`);
    }

    request.resource.table = db.table(resource);

    response.jsonapi = (data, links) => {
      response
        .set('Content-Type', 'application/vnd.api+json')
        .json(this.getSerialiser(request).serialise(resource, data, links));
    };

    next();
  }



  validateMiddleware(request, response, next) {
    let data = request.body.data;

    if (!data) {
      next(new BadRequestError(`expected 'data' field in request body`));

    } else if (!data.attributes) {
      next(new BadRequestError(`expected 'data.attributes' field in request.body`));

    } else if (data.type !== request.params.resource) {
      throw new ConflictError(`'data.type' must equal '${request.params.resource}', not '${data.type}'`);

    } else if (request.resource.schema) {
      let validation = Joi.validate(data.attributes, request.resource.schema);

      if (validation.error) {
        next(validation.error);
      } else {
        request.data = validation.value;
        next();
      }
    } else {
      request.data = validation.value;
      next();
    }
  }
};


function applyFilter(request, table) {
  if (request.query.filter) {
    let filter = _.mapValues(request.query.filter, JSON.parse);
    return table.filter(filter);

  } else {
    return table;
  }
}


function applyProjection(request, table) {
  if (request.query.fields && request.query.fields[request.param.resource]) {
    return table.pluck(request.query.fields.split(','));
  } else {
    return table;
  }
}


function applySort(request, table) {
  if (request.query.sort) {
    let orderBy = [];
    let sort = request.query.split(',');

    for (let s of sort) {
      if (s.startsWith('-')) {
        orderBy.push(r.desc(s.substring(1)));
      } else {
        orderBy.push(s);
      }
    }

    return table.orderBy.apply(query, orderBy);

  } else {
    return table;
  }
}


function getPaging(request, count) {
  let page = _.mapValues(request.query.page || {}, parseInt);
  let limit = page.size || page.limit || defaultPageSize;
  let offset = page.offset || ((page.number - 1) * limit) || 0;
  let pageCount = Math.ceil(count / limit);
  let links = {};

  if (typeof page.offset !== 'undefined' || typeof page.limit !== 'undefined') {
    links = {
      first: `~?page[limit]=${limit}`,
      last: `~?page[offset]=${(pageCount-1)*limit}&page[limit]=${limit}`
    };

    if (offset > 0) {
      links.prev = `~?page[offset]=${Math.max(0, offset - limit)}&page[limit]=${limit}`;
    }

    if (offset < count) {
      links.next = `~?page[offset]=${Math.min(count, offset + limit)}&page[limit]=${limit}`;
    }

  } else {
    page.number = page.number || 1;

    links = {
      first: `~?page[size]=${limit}&page[number]=1`,
      last: `~?page[size]=${limit}&page[number]=${pageCount || 1}`
    };

    if (page.number > 1) {
      links.prev = `~?page[size]=${limit}&page[number]=${page.number - 1}`;
    }

    if (page.number < pageCount) {
      links.next = `~?page[size]=${limit}&page[number]=${page.number + 1}`;
    }
  }

  return {limit, offset, links};
}
