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

// Read the tunes folder and load all available file names
// Read the backup.json file for any previously backed up vote counts
loadFileNamesAndVotes();


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
        save();
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

///////////////////////////////// UTIL /////////////////////////////////

/**
 * Save the current vote count to disk
 */
var save = function() {

    fs.open('backup.json', 'a', 0755, function (err, fd) {

        if (err) {
            debug(err);
        }
        else {
            fs.write(fd, JSON.stringify(GLOBAL.files), 0, 'Binary', function () {
                debug('Vote count saved!');
            });
        }
    });
};

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
    save();
};

/**
 * Read the tunes folder and set up the global file list object
 */
var loadFileNamesAndVotes = function() {

    fs.readdir('public/tunes', function (err, files) {

        if (err) {
            // TODO emit it
            debug('error reading public tunes folder', err);
            throw err;
        }

        // Load the file names into the global files object
        // Filter out anything that's not an audio file
        for (var i = 0; i < files.length; i++) {

            var file = files[i];

            if (file.indexOf('.mp3') > 0 || file.indexOf('.wav') > 0) {

                GLOBAL.files[file] = {
                    votes: 0
                };
            }
        }

        // Try to read the vote count previously saved to disk, if any
        try {

            var backupJSON = fs.readFileSync('backup.json', {encoding: 'utf8'});

            var backup = JSON.parse(backupJSON);

            // update any backed up vote counts
            for (var tune in backup) {

                GLOBAL.files[key].votes = tune.votes;
            }
        }
        catch (e) {
            debug('error parsing backup votes', e, backupJSON);
            //TODO delete the corrupt file
        }
    });
};

