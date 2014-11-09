var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var debug = require('debug')('server');

var port = process.env.PORT || 3000;

var uploader = require('./uploader');
var voting = require('./voting');
var cron = require('./cron');
var util = require('./util');

///////////////////////////////// SERVER SETUP /////////////////////////////////

// List of tunes and their vote counts
GLOBAL.files = {};

// Sockets for this server
GLOBAL.io = io;

// Host static files
app.use(express.static(__dirname + '/public')); //jshint ignore:line

// Start listening on defined port
server.listen(port, function () {
    debug('Server listening at port %d', port);
});

// Initialize the cron module
// Sets up the alarm every day to play the winning tune
// resets the vote count after cron executes
cron.init(util.playTune);

// Load all available tunes and their votes
uploader.init();

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
        util.saveVoteCount();
    });

    // Uploading: Start saving a new file or resuming a previous upload
    socket.on('start upload', function (data) {
        uploader.startUpload(data, socket);
    });

    // Uploading: Save the chunk of the file send from the client
    socket.on('upload', function (data) {
        uploader.upload(data, socket);
    });
});
