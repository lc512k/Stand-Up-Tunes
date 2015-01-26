var express     = require('express');
var app         = express();
var http        = require('http');
var debug       = require('debug')('server');
var server      = http.createServer(app).listen(3000);
var io          = require('socket.io')(server);

var fsManager   = require('./fileSystemManager');
var voting      = require('./voting');
var cron        = require('./cron');
var util        = require('./util');


///////////////////////////////// SERVER SETUP /////////////////////////////////

var PLAY_TIME = '9:40 am';

// List of tunes and their vote counts
GLOBAL.files = {};

GLOBAL.tally = {};

// Sockets for this server
GLOBAL.io = io;

// Host static files
app.use(express.static(__dirname + '/public')); //jshint ignore:line

// Start the http server
server.listen(3000, function () {
    console.log('debug be ded');
    debug('Server listening at port %d', 3000);
});

// Load all available tunes and their votes
fsManager.init();

debug('files', GLOBAL.files);
debug('tally', GLOBAL.tally);

// Initialize the cron module
// Sets up the alarm every day to play the winning tune
// resets the vote count after cron executes
cron.init(util.playTune);

///////////////////////////////// CLIENT CONNECTIONS /////////////////////////////////

io.sockets.on('connection', function (socket) {

    var authenticated = false;
    var name;

    // A client connected
    socket.on('init', function () {
        debug('Headers',  socket.client.request.headers);

        var clientIp = socket.client.conn.remoteAddress;
        debug('New client connected ', clientIp);

        if (authenticated) {
            // Give the client the list of tunes
            // and the time the next jingle will play
            socket.emit('startup', {
                files: GLOBAL.files,
                playTime: PLAY_TIME
            });

            // Say Hi!
            socket.emit('welcome', name);

            // Tell everyone else this client joined
            socket.broadcast.emit('new user', name);
        }
        else {
            debug('not authenticated');
            socket.emit('authenticate');
        }
    });

    socket.on('login', function (loginData) {
        debug('logged in with ', loginData);
        authenticated = loginData.name ? true : false;
        name = loginData.name;
    });

    // Handle a vote
    socket.on('vote', function (tuneId) {

        var votingClientIp = socket.client.conn.remoteAddress;

        debug('vote received for ' + tuneId + ' by ' + votingClientIp);

        // Store the vote and broadcast the new vote counts to all clients
        voting.save(tuneId, socket, votingClientIp);

        // save new vote count to disk
        //util.saveCounts();
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
