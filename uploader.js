var debug = require('debug')('uploader');
var fs = require('fs');

var ONE_KB = 1024;
var HUNDRED_KB = ONE_KB * 100;
var ONE_MB = Math.pow(ONE_KB, 2);
var TEN_MB = ONE_MB * 10;

/**
 * Write a 100KB chunk of a file to disk
 * Notify the client when done
 * so it can send the next chunk
 * @param  {Object} data
 * @param  {Socket} socket
 */
exports.upload = function (data, socket) {
    var name = data.name;
    var thisFile = GLOBAL.files[name];

    thisFile.downloaded += data.data.length;
    thisFile.data += data.data;

    // If file is done
    if (thisFile.downloaded === thisFile.fileSize) {
        fs.write(thisFile.handler, thisFile.data, null, 'Binary', function () {
            socket.emit('done', name);
            debug('done!');
        });
    }
    else if (thisFile.data.length > TEN_MB) {
        socket.emit('abort. file is over 10megs');
    }
    else {
        var size = thisFile.fileSize;
        var marker = thisFile.downloaded / HUNDRED_KB;
        var percent = (thisFile.downloaded / GLOBAL.files[name].fileSize) * 100;
        debug('progress ' + Math.round(percent) + '%');
        socket.emit('more data', {
            marker: marker,
            percent: percent,
            size: size
        });
    }
};

/**
 * Init a file upload
 * @param  {Object} data
 * @param  {Socket} socket
 */
exports.startUpload = function (data, socket) {
    var name = data.name;

    // Add the file to the global file list
    GLOBAL.files[name] = {
        fileSize: data.size,
        handler: '',
        data: '',
        downloaded: 0,
        votes: 0
    };

    var marker = 0;

    try {
        var existingFile = fs.statSync('public/tunes/' + name);

        // If the file exists in public/tunes/
        // continue downloading where we left off
        if (existingFile.isFile()) {
            debug('Resuming upload...');
            GLOBAL.files[name].downloaded = existingFile.size;
            marker = existingFile.size / HUNDRED_KB;
        }
    }
    catch (err) {
        debug('Uploading new tune...');
    }

    /**
     * If it's a new file we create it,
     * if it's an existing file we open it.
     * We ask the client to send more data.
     */
    fs.open('public/tunes/' + name, 'a', 0755, function (err, fd) {
        if (err) {
            debug(err);
        }
        else {
            // Store the file handler so we can write to it later
            GLOBAL.files[name].handler = fd;

            socket.emit('more data', {
                marker: marker,
                percent: 0
            });
        }
    });
};
