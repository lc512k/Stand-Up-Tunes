// > DEBUG=http,uploader,timer node server.js

/* global votes */
GLOBAL.votes = {};

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var debug = require('debug')('http');
var fs = require('fs');

var uploader = require('./uploader');
var timer = require('./timer');
// TODO require('./voting');

var files = {};

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

///////////////////////////////// STARTUP /////////////////////////////////

server.listen(port, function () {
    debug('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public')); //jshint ignore:line

io.on('connection', function (socket) {

    socket.on('init', function () {
        debug('booting');

        timer.init();

        fs.readdir('tunes', function (err, files) {

            if (err) {
                // TODO emit it
                throw err;
            }

            // TODO filter out stuff that isn't music
            socket.emit('tunes list', {
                tuneIds: files
            });
        });

        socket.emit('loading file list');
    });

    socket.on('vote', function (tuneId) {
        debug('vote received', tuneId);

        // If this tune hasn't been voted on before, register it
        // with zero votes
        votes[tuneId] = votes[tuneId] || {count:0};

        // Increase the vote count by one
        votes[tuneId].count++;

        // Update the client with the new vote
        socket.broadcast.emit('new vote', {
            tuneId: tuneId,
            count: votes[tuneId].count
        });

        debug('tally', votes);
    });

    /**
     * Start a new file upload
     * Long uploads can be resumed
     * @param {Object} data the file data
     */
    socket.on('start upload', function (data) {
        uploader.startUpload(data, files, socket, fs);
    });

    socket.on('upload', function (data) {
        uploader.upload(data, files, socket, fs);
    });
});
