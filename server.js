var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var debug = require('debug')('server');
var fileServer = require('fs');

var port = process.env.PORT || 3000;

var uploader = require('./uploader');
var timer = require('./timer');
var voting = require('./voting');

///////////////////////////////// GLOBALS /////////////////////////////////

/* global files */

/**
 * List of tuneIds and their vote counts
 * A tuneId is the file handler for the sound file
 *
 * {
 *     '214324' : {
 *         count: 12
 *     },
 *     '465344' {
 *         count: 4
 *     }
 * }
 */
GLOBAL.files = {};

// Host static files
app.use(express.static(__dirname + '/public')); //jshint ignore:line

// Start listening on defined port
server.listen(port, function () {
    debug('Server listening at port %d', port);
});

// Initialize the timer module
// Sets up the alarm every day based on the winning tune
timer.init();

// Connect
io.sockets.on('connection', function (socket) {

    // A client connected
    socket.on('init', function () {

        var clientIp = socket.client.conn.remoteAddress;
        debug('New client connected ', clientIp);

        // Say Hi!
        socket.emit('welcome', clientIp);

        // Tell everyone else too
        socket.broadcast.emit('new user', clientIp);
    });

    // Tell the client we've started reading the file list
    // Client may choose to show a spinner
    socket.emit('loading file list');

    // Tell the client what tunes we have that can be voted on
    fileServer.readdir('public/tunes', function (err, files) {

        if (err) {
            // TODO emit it
            throw err;
        }

        // Load the files into the global files object
        prePopulate(files);

        // Filter out stuff that isn't music
        // and send the list to the client
        socket.emit('tunes list', GLOBAL.files);

    });

    // Handle a vote
    socket.on('vote', function (tuneId) {
        debug('vote received for ' + tuneId);

        // Count the vote and broadcast the new vote counts to all clients
        voting.send(tuneId, socket);
    });

    // Start saving a new file or resuming a previous upload
    socket.on('start upload', function (data) {
        uploader.startUpload(data, files, socket, fileServer);
    });

    // Save the chunk of the file send from the client
    socket.on('upload', function (data) {
        uploader.upload(data, files, socket, fileServer);
    });
});

// UTILS
var prePopulate = function (readFiles) {

    // Filter out anything that's not an audio file

    for (var i = 0; i < readFiles.length; i++) {
        var file = readFiles[i];
        if (file.indexOf('.mp3') > 0 || file.indexOf('.wav') > 0) {
            GLOBAL.files[file] = {
                votes: 0
            };
        }
    }
};
