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
timer.init();

// Read tunes folder and set up file list
fileServer.readdir('public/tunes', function (err, files) {

    if (err) {
        // TODO emit it
        throw err;
    }

    // Load the files into the global files object
    // Filter out anything that's not an audio file
    for (var i = 0; i < files.length; i++) {

        var file = files[i];

        if (file.indexOf('.mp3') > 0 || file.indexOf('.wav') > 0) {

            GLOBAL.files[file] = {
                votes: 0
            };
        }
    }
});

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
    });

    // Start saving a new file or resuming a previous upload
    socket.on('start upload', function (data) {
        uploader.startUpload(data, socket);
    });

    // Save the chunk of the file send from the client
    socket.on('upload', function (data) {
        uploader.upload(data, socket);
    });
});
