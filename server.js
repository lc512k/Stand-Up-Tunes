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
var util = require('./util');
var pushManager = require('./pushManager');

var PLAY_TIME = '9:40 am';
var STANDUP_TIME = '0 40 9 * * 1-5';
var PUSH_ITME = '0 30 9 * * 1-5';
var EVERY_MINUTE = '0 * * * * *';

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

// Start the http server
server.listen(3000, function () {
    console.log('debug be ded');
    debug('Server listening at port %d', 3000);
});

// Load all available tunes and their votes
fsManager.init();

debug('files', GLOBAL.files);
debug('tally', GLOBAL.tally);

// Set cron to play tune at default time
cron.set(util.playTune, STANDUP_TIME, 'playback');

// Set cron to send push notifications
cron.set(pushManager.sendPushNotifications, EVERY_MINUTE, 'push');

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
