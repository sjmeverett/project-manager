
import _ from 'lodash';
import Joi from 'joi';
import {db, config} from '../index';
import * as web from 'express-decorators';
import * as extra from '../lib/extra-decorators';
import * as error from '../lib/errors';

const changesets = db.table('changesets');
const requirements = db.table('requirements');

@web.controller('/resources/changesets')
export default class ChangesetsController {

  @web.copy('/:id')
  async mergeAction(request, response) {
    let changeset = await changesets.get(request.params.id);

    if (!changeset)
      throw new error.NotFoundError(`changeset ${request.params.id} not found`);

    if (changeset.add) {
      await requirements.insert(changeset.add);
    }

    if (changeset.remove) {
      for (let id of changeset.remove) {
        await requirements.get(id).remove();
      }
    }

    if (changeset.modify) {
      for (let req of changeset.modify) {
        await requirements.get(req.id).update({description: req.description});
      }
    }

    response
      .status(204)
      .send();
  }
};
