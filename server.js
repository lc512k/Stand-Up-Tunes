var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var fs = require('fs');

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
var votes = {};

// CONSTANTS
var ONE_KB = 1024;
var HUNDRED_KB = ONE_KB * 100;
var ONE_MB = Math.pow(ONE_KB, 2);
var TEN_MB = ONE_MB * 10;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public')); //jshint ignore:line

io.on('connection', function (socket) {

    socket.on('init', function () {
        console.log('booting');

        fs.readdir('temp', function (err, files) {

            if (err) {
                // TODO emit it
                throw err;
            }

            // TODO filter out stuff
            socket.emit('tunes list', {
                tuneIds: files
            });
        });

        socket.emit('loading file list');
    });

    socket.on('vote', function (tuneId) {
        console.log('vote received', tuneId);

        // If this tune hasn't been voted on before, add it to 'votes'
        votes[tuneId]       = votes[tuneId] || {};

        // Increase the vote count by one
        votes[tuneId].count = votes[tuneId].count ? votes[tuneId].count++ : 1;

        // Update the client with the new vote
        socket.broadcast.emit('new vote', {
            tuneId: tuneId,
            count: votes[tuneId].count
        });
    });

    /**
     * Start a new file upload
     * Long uploads can be resumed
     * @param {Object} data the file data
     */
    socket.on('start upload', function (data) {
        var name = data.name;

        files[name] = {
            fileSize: data.size,
            handler: '',
            data: '',
            downloaded: 0
        };

        var marker = 0;

        try {
            var existingFile = fs.statSync('temp/' + name);

            /**
             * If the file exists in temp/
             * continue downloading where we left off
             */
            if (existingFile.isFile()) {
                console.log('Resuming upload...');
                files[name].downloaded = existingFile.size;
                marker = existingFile.size / HUNDRED_KB;
            }
        }
        catch (err) {
            console.log('Uploading new tune...');
        }

        /**
         * If it's a new file we create it,
         * if it's an existing file we open it.
         * We ask the client to send more data.
         * @param  {[type]} err [description]
         * @param  {[type]} fd  [description]
         * @return {[type]}     [description]
         */
        fs.open('temp/' + name, 'a', 0755, function (err, fd) {
            if (err) {
                console.log(err);
            }
            else {

                /**
                 * Store the file handler so we can write to it later
                 * The handler will also be used as the element id in the DOM
                 */
                files[name].handler = fd;

                socket.emit('more data', {
                    marker: marker,
                    percent: 0
                });
            }
        });
    });

    socket.on('upload', function (data) {
        var name = data.name;

        files[name].downloaded += data.data.length;
        files[name].data += data.data;

        // If File is Fully Uploaded
        if (files[name].downloaded === files[name].fileSize) {
            fs.write(files[name].handler, files[name].data, null, 'Binary', function (err, Writen) {
                //Get Thumbnail Here
            });
            socket.emit('done');
            console.info('upload done');
        }
        else if (files[name].data.length > TEN_MB) {
            socket.emit('abort. file is over 10megs');
        }
        else {
            console.info('PROGRESS', files[name].downloaded, HUNDRED_KB);
            var marker = files[name].downloaded / HUNDRED_KB;
            var percent = (files[name].downloaded / files[name].fileSize) * 100;
            socket.emit('more data', {
                'marker': marker,
                'percent': percent
            });
            console.info('uploading ', percent);
        }
    });

});