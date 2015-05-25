//screen node server -L &

var express = require('express');
var app = express();
var http = require('http');
var debug = require('debug')('server');
var server = http.createServer(app).listen(3000);
var io = require('socket.io')(server);
var MongoClient = require('mongodb').MongoClient;

var fsManager = require('./fileSystemManager');
var voting = require('./voting');
var cron = require('./cron');
//var util = require('./util');
var pushManager = require('./pushManager');

var PLAY_TIME = '9:40 am';
var STANDUP_TIME = '0 40 9 * * 1-5';
var PUSH_ITME = '0 30 9 * * 1-5';
//var STANDUP_TIME = '0 * * * * *';

///////////////////////////////////// MONGO //////////////////////////////////

// var url = 'mongodb://localhost:27017/sut';

// MongoClient.connect(url, function (err, db) {

//     if (err) {
//         console.error('error connecting to db', err);
//     }
//     console.log('Connected correctly to server');

//     db.close();
// });

///////////////////////////////// SERVER SETUP /////////////////////////////////

// List of tunes and their vote counts
GLOBAL.files = {};
GLOBAL.tally = {};
GLOBAL.pushRegistrationIds = [];

// Sockets for this server
GLOBAL.io = io;

// Host static files
app.use(express.static(__dirname + '/public')); //jshint ignore:line
app.use('/docs', express.static(__dirname + '/docs')); //jshint ignore:line

// Start the http server
server.listen(3000, function () {
    debug('Server listening at port %d', 3000);
});

// Load all available tunes and their votes
fsManager.init();

debug('files', GLOBAL.files);
debug('tally', GLOBAL.tally);

// Set cron to play tune at default time
//cron.set(util.playTune, STANDUP_TIME, 'playback');

// Set cron to send push notifications
cron.set(pushManager.sendPushNotifications, PUSH_ITME, 'push');

///////////////////////////////// CLIENT CONNECTIONS /////////////////////////////////

io.sockets.on('connection', function (socket) {
    console.log('connection');

    socket.on('init', function (cookie) {
    //debug('Headers',  socket.client.request.headers);

    console.log('New init ', cookie);

        //debug('Headers',  socket.client.request.headers);

        console.log('New client connected ', cookie);

        socket.emit('startup', {
            files: GLOBAL.files,
            playTime: PLAY_TIME
        });

        // Say Hi!
        socket.emit('welcome', cookie);

        // Tell everyone else this client joined
        socket.broadcast.emit('new user', cookie);

    });

    // Handle a vote
    socket.on('vote', function (tuneId, cookie) {

        debug('vote received for ' + tuneId + ' by ' + cookie);

        debug('FILES', GLOBAL.files);
        debug('TALLY', GLOBAL.tally);

        // Store the vote and broadcast the new vote counts to all clients
        voting.save(tuneId, socket, cookie);
    });

    // Uploading: Start saving a new file or resuming a previous upload
    socket.on('start upload', function (data) {
        fsManager.startUpload(data, socket);
    });

    // Uploading: Save the chunk of the file send from the client
    socket.on('upload', function (data) {
        fsManager.upload(data, socket);
    });

    socket.on('pushSubscription', function (pushSubscription) {
        pushManager.subscribe(pushSubscription);
    });
});
