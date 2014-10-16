var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var debug = require('debug')('server');
var fs = require('fs');

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
GLOBAL.votes = {};
GLOBAL.files = {};

// Host static files
app.use(express.static(__dirname + '/public')); //jshint ignore:line

// Start listening on defined port
server.listen(port, function () {
    debug('Server listening at port %d', port);
});

// Connect
io.on('connection', function (socket) {

    // Initialize the timer module
    // Sets up the alarm every day based on the winning tune
    // TODO GET THIS ONE OUT OF HERE. DO ONLY ONCE< NOT PER CLIENT
    timer.init();

    // Initialize the voting module
    // Tells the client about the existing tunes to vote on
    voting.init(files, socket);

    // A client connected
    socket.on('init', function () {
        debug('client connected');
    });

    socket.on('vote', function (tuneId) {
        debug('vote received', tuneId);

        // Count the vote and broadcast the new vote counts to all clients
        voting.send(tuneId, socket);
    });

    // Start saving a new file or resuming a previous upload
    socket.on('start upload', function (data) {
        uploader.startUpload(data, files, socket, fs);
    });

    // Save the chunk of the file send from the client
    socket.on('upload', function (data) {
        uploader.upload(data, files, socket, fs);
    });
});
