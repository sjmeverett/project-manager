
import thinky, {type} from '../lib/db';

export default {
  Model: thinky.createModel('User', {

  }),
  acl: {
    create: ['*'],

    update (user, id) {
      return user != null && user.id === id;
    }
  }
};
