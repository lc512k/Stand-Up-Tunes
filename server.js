var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var debug = require('debug')('server');
var fs = require('fs');

var port = process.env.PORT || 3000;

var fsManager = require('./fsmanager');
var timer = require('./timer');
var voting = require('./voting');

///////////////////////////////// SERVER SETUP /////////////////////////////////

// List of tunes and their vote counts
GLOBAL.files = {};

// Host static files
app.use(express.static(__dirname + '/public')); //jshint ignore:line

// Start listening on defined port
server.listen(port, function () {
    debug('Server listening at port %d', port);
});

// Initialize the timer module
// Sets up the alarm every day to play the winning tune
timer.init(io);

// Load all available tunes and their votes
fsManager.init();


///////////////////////////////// CLIENT CONNECTIONS /////////////////////////////////

io.sockets.on('connection', function (socket) {

    // A client connected
    socket.on('init', function () {

        var clientIp = socket.client.conn.remoteAddress;
        debug('New client connected ', clientIp);

        // Give the client the list of tunes
        socket.emit('tunes list', GLOBAL.files);

        // Say Hi!
        socket.emit('welcome', clientIp);

        // Tell everyone else this client joined
        socket.broadcast.emit('new user', clientIp);
    });

    // Handle a vote
    socket.on('vote', function (tuneId) {

        debug('vote received for ' + tuneId);

        // Store the vote and broadcast the new vote counts to all clients
        voting.send(tuneId, socket);

        // save new vote count to disk
        fsManager.save();
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

///////////////////////////////// UTIL /////////////////////////////////

/**
 * Reset all vote counts to zero
 * Vote counts are reset every morning after standup
 * (except on playback error)
 */
var resetVoteCount = GLOBAL.resetVoteCount = function() {

    for (var key in GLOBAL.files) {
        GLOBAL.files[key].votes = 0;
    }

    // Save to disk
    fsManager.save();
};
