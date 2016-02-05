
import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import pkg from 'package.json';
import rc from 'rc-yaml';
import requireAll from 'require-all';

export let config;
export let app;

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
}
