
import bodyParser from 'body-parser';
import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import pkg from 'package.json';
import Promise from 'bluebird';
import rc from 'rc-yaml';
import requireAll from 'require-all';
import RethinkPlus from 'rethink-plus';
import Serialiser from 'serialise2jsonapi';

Promise.longStackTraces();

export let config;
export let app;
export let db;

export default function (options) {
  // load the config
  config = rc(pkg.name.replace(/-/g, ''), {
    port: 3000
  }, options);

  createApp();
  loadControllers();
};


export function start() {
  app.listen(config.port);
};


function createApp() {
  app = express();

  let viewdir = __dirname + '/views';
  app.engine('html', exphbs({extname: '.html', layoutsDir: viewdir, partialsDir: viewdir}));
  app.set('view engine', 'html');
  app.set('views', viewdir);
  app.use('/static', express.static(path.join(__dirname, '../../public')));
  app.use(bodyParser.json());

  db = new RethinkPlus(config.database || {database: 'test'});
}


function loadControllers() {
  requireAll({
    dirname: __dirname + '/controllers',
    filter: /(.+)Controller\.js$/,
    recursive: true,
    resolve: function (Controller) {
      let c = new (Controller.__esModule ? Controller.default : Controller)();
      c.register && c.register(app);
      return c;
    }
  });

  app.use(function (error, request, response, next) {
    if (!error.code)
      //console.log(error.stack.split('\n').filter((x) => !/node_modules/.test(x)).join('\n'));
      console.log(error.stack);

    response
      .status(parseInt(error.status) || 500)
      .json(new Serialiser().serialise(request.params.resource, error));
  });
}
