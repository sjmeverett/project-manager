
require('babel-register');
require('rootpath')();

var server = require('src/server');
server.default();
server.start();
