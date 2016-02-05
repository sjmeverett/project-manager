
import * as web from 'express-decorators';
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

  resourceMiddleware(request, response, next) {
    let resourceDescription = this.resources[request.params.resource];

    if (!resourceDescription) {
      response
        .status(404)
        .json({
          error: {
            title: 'Not found',
            detail: `Unknown resource "${request.params.resource}"`
          },
          meta: {
            resource: request.params.resource
          }
        });

    } else {
      request.resourceDescription = resourceDescription;
      next();
    }
  }

  @web.get('/:resource')
  @web.middleware('resourceMiddleware')
  async retrieveResourcesAction(request, response) {
    let resources = await request.resourceDescription.Model.run();
  }
};
