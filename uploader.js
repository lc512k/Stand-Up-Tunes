var debug = require('debug')('uploader');
var fs = require('fs');

var ONE_KB = 1024;
var HUNDRED_KB = ONE_KB * 100;
var ONE_MB = Math.pow(ONE_KB, 2);
var TEN_MB = ONE_MB * 10;

/**
 * [upload description]
 * @param  {[type]} data   [description]
 * @param  {[type]} files  [description]
 * @param  {[type]} socket [description]
 * @return {[type]}        [description]
 */
exports.upload = function (data, files, socket) {
    var name = data.name;
    files[name].downloaded += data.data.length;
    files[name].data += data.data;

    // If file is done
    if (files[name].downloaded === files[name].fileSize) {
        fs.write(files[name].handler, files[name].data, null, 'Binary', function () {
            socket.emit('done');
            debug('done!');
        });
    }
    else if (files[name].data.length > TEN_MB) {
        socket.emit('abort. file is over 10megs');
    }
    else {
        var size = files[name].fileSize;
        var marker = files[name].downloaded / HUNDRED_KB;
        var percent = (files[name].downloaded / files[name].fileSize) * 100;
        debug('progress ' + Math.round(percent) + '%');
        socket.emit('more data', {
            marker: marker,
            percent: percent,
            size: size
        });
    }
};

/**
 * [startUpload description]
 * @param  {[type]} data   [description]
 * @param  {[type]} files  [description]
 * @param  {[type]} socket [description]
 * @return {[type]}        [description]
 */
exports.startUpload = function (data, files, socket) {
    var name = data.name;

    files[name] = {
        fileSize: data.size,
        handler: '',
        data: '',
        downloaded: 0
    };

    var marker = 0;

    try {
        var existingFile = fs.statSync('tunes/' + name);

        // If the file exists in tunes/
        // continue downloading where we left off
        if (existingFile.isFile()) {
            debug('Resuming upload...');
            files[name].downloaded = existingFile.size;
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
     * @param  {[type]} err [description]
     * @param  {[type]} fd  [description]
     * @return {[type]}     [description]
     */
    fs.open('tunes/' + name, 'a', 0755, function (err, fd) {
        if (err) {
            debug(err);
        }
        else {
            // Store the file handler so we can write to it later
            // The handler will also be used as the element id in the DOM
            files[name].handler = fd;

            socket.emit('more data', {
                marker: marker,
                percent: 0
            });
        }
    });
};
