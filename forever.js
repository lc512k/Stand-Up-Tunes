//https://github.com/foreverjs/forever-monitor
// Run as nohup nodde forever > foo.out 2> foo.err < /dev/null &

var debug = require('debug')('forever');

var forever = require('forever-monitor');

var child = new (forever.Monitor)('server.js', {
    max: 100,
    silent: false,
    args: []
});

child.on('exit', function () {
    debug('server.js has exited after 100 restarts');
});

child.on('restart', function () {
    debug('Forever restarting script for ' + child.times + ' time');
});

child.start();

debug('started forever');
