var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var debug = require('debug')('server');

var port = process.env.PORT || 3000;

var fsManager = require('./fileSystemManager');
var voting = require('./voting');
var cron = require('./cron');
var util = require('./util');

///////////////////////////////// SERVER SETUP /////////////////////////////////

// List of tunes and their vote counts
GLOBAL.files = {};

// List of users who have connected today
GLOBAL.users = {};

// Sockets for this server
GLOBAL.io = io;

// Host static files
app.use(express.static(__dirname + '/public')); //jshint ignore:line

// Host tests
// TODO don't
app.use('/test', express.static(__dirname + '/test')); //jshint ignore:line

// Start listening on defined port
server.listen(port, function () {
    debug('Server listening at port %d', port);
});

// Load all available tunes and their votes
fsManager.init();

debug('files', GLOBAL.files);
debug('users', GLOBAL.users);

// Initialize the cron module
// Sets up the alarm every day to play the winning tune
// resets the vote count after cron executes
cron.init(util.playTune);

///////////////////////////////// CLIENT CONNECTIONS /////////////////////////////////

io.sockets.on('connection', function (socket) {

    // A client connected
    socket.on('init', function () {

        var clientIp = socket.client.conn.remoteAddress;
        debug('New client connected ', clientIp);

        // Give the client the list of tunes
        // and the time the next jingle will play
        socket.emit('startup', {
            files: GLOBAL.files,
            playTime: cron.getPlayTime()
        });

        // add their IP to the list
        var returningUser = GLOBAL.users[clientIp];

        var returning = false;

        if (returningUser) {
            // We've met before
            returning = true;
            debug('returning user', clientIp);
        }
        else {
            // Add user with defaults
            GLOBAL.users[clientIp] = {
                votesLeft: voting.DEFAULT_VOTES,
                votesToday: 0
            };
            debug('new user', clientIp);
        }

        debug('user info', GLOBAL.users[clientIp]);

        // Say Hi!
        socket.emit('welcome', clientIp, GLOBAL.users[clientIp].votesLeft, returning);

        // Tell everyone else this client joined
        socket.broadcast.emit('new user', clientIp);
    });

    // Handle a vote
    socket.on('vote', function (tuneId) {

        var votingClientIp = socket.client.conn.remoteAddress;

        debug('vote received for ' + tuneId + ' by ' + votingClientIp);

        if (!GLOBAL.users[votingClientIp]) {
            debug('Don\'t know you ', votingClientIp);
            return;
        }

        if (GLOBAL.users[votingClientIp].votesLeft === 0) {
            debug('No votes left for ', votingClientIp);
            return;
        }

        debug('vote accepted for ' + tuneId + ' by ' + votingClientIp);

        GLOBAL.users[votingClientIp].votesLeft--;
        GLOBAL.users[votingClientIp].votesToday++;
        GLOBAL.users[votingClientIp].votedFor = tuneId;

        // Store the vote and broadcast the new vote counts to all clients
        voting.save(tuneId, socket);

        // save new vote count to disk
        util.saveCounts();
    });

    // Uploading: Start saving a new file or resuming a previous upload
    socket.on('start upload', function (data) {
        fsManager.startUpload(data, socket);
    });

    // Uploading: Save the chunk of the file send from the client
    socket.on('upload', function (data) {
        fsManager.upload(data, socket);
    });
});
