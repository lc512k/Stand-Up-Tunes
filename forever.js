var debug = require('debug')('forever');

var forever = require('forever-monitor');

var child = new (forever.Monitor)('server.js', {
    max: 10,
    silent: false,
    args: []
});

child.on('exit', function () {
    debug('server.js has exited after 3 restarts');
});

child.start();

debug('started forever');