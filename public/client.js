/* global window, document, FileReader, io */

var socket = io();

// FILE SIZE CONSTANTS
var HALF_MB = 524288;
var ONE_MB = HALF_MB * 2;
var ONE_KB = ONE_MB / 1024;
var HUNDRED_KB = ONE_KB * 100;
var USER_LOG_STYLE = 'color: lime; background-color: black; padding: 4px;';

///////////////////////////////// UI /////////////////////////////////

var UI = {
    tunesContainer: document.getElementById('tunes-container'),
    fileBox: document.getElementById('file-box'),
    selectedFile: null,

    updateProgressBar: function (percent) {
        if (!this.selectedFile) {
            console.error('no file selected');
            return;
        }
        document.getElementById('progress-bar').style.width = percent + '%';
        document.getElementById('percent').innerHTML = (Math.round(percent * 100) / 100) + '%';
        var kilobitesDone = Math.round(((percent / 100.0) * this.selectedFile.size) / ONE_KB);
        document.getElementById('kb').innerHTML = kilobitesDone;
    },

    cleanTunesList: function () {
        while (this.tunesContainer.firstChild) {
            this.tunesContainer.removeChild(this.tunesContainer.firstChild);
        }
    },

    createTuneItem: function (tuneId) {

        // Score container
        var scoreContainer = document.createElement('span');
        scoreContainer.className = 'tune-score';
        scoreContainer.appendChild(document.createTextNode('3'));

        // Vote button with label for each tune
        var voteBtn = document.createElement('a');
        var voteLabel = document.createTextNode('♡');
        voteBtn.appendChild(voteLabel);
        voteBtn.addEventListener('click', onCastVote);

        // Tune name
        var tuneNameContainer = document.createElement('span');
        tuneNameContainer.className = 'tune-name';
        var tuneName = document.createTextNode(tuneId);
        tuneNameContainer.appendChild(tuneName);

        // Tune audio
        var tuneAudioContainer = document.createElement('div');
        var tuneAudio = document.createElement('audio');
        var tuneSource = document.createElement('source');
        //TODO use url as source
        tuneSource.setAttribute('src', 'http://66.90.91.26:777/ost/mario-bros/yulwardwfa/01-mb-title.mp3');
        tuneSource.setAttribute('type', 'audio/mpeg');
        tuneAudio.appendChild(tuneSource);
        tuneAudio.setAttribute('controls', '');
        tuneAudio.setAttribute('style', 'display');
        tuneAudioContainer.appendChild(tuneAudio);
        tuneAudioContainer.className = 'tune-audio';

        // Container for each tune
        var tuneItem = document.createElement('li');
        tuneItem.setAttribute('data-tune-id', tuneId);
        tuneItem.className = 'tune-item';

        tuneItem.appendChild(scoreContainer);
        tuneItem.appendChild(tuneNameContainer);
        tuneItem.appendChild(tuneAudioContainer);
        tuneItem.appendChild(voteBtn);

        return tuneItem;
    },
    addRow: function (tuneId) {
        var tuneItem = this.createTuneItem(tuneId);
        UI.tunesContainer.appendChild(tuneItem);
    }

};

// INIT


socket.on('tunes list', function (data) {
    UI.cleanTunesList();

    for (var i = 0; i < data.tuneIds.length; i++) {
        var tuneItem = UI.createTuneItem(data.tuneIds[i]);
        UI.tunesContainer.appendChild(tuneItem);
    }
});

socket.on('welcome', function (ip) {
    console.log('%c Welcome, %s', USER_LOG_STYLE, ip);
});
socket.on('new user', function (ip) {
    console.log('%c %s joined!', USER_LOG_STYLE, ip);
});

/////////////////////////////// PLAYBACK ///////////////////////////////
// TODO hide the default audio ui, make small play button that when you .on('click', play)
// var v = document.getElementsByTagName('video')[0];
// v.play();

/////////////////////////////// VOTING ///////////////////////////////

/**
 * Event handler for Vote button
 * When the user clicks a vote button for a tune
 * send the tuneId to the server
 * @param  {Event} e [description]
 */
function onCastVote(e) {
    var voteButton = e.currentTarget;
    var tuneContainer = voteButton.parentNode;
    var chosenTuneId = tuneContainer.dataset.tuneId;

    if (chosenTuneId) {
        socket.emit('vote', chosenTuneId);
    }
    else {
        console.error('no tuneId for', chosenTuneId);
    }
}

/**
 * Server message listener
 * The server emits 'new vote' every time it receives a 'vote'
 * Update the UI with the new vote count
 * @param {Object} data
 * @param {String} data.tuneId
 * @param {String} data.count
 */
socket.on('new vote', function (data) {
    // TODO update the counter, swap the rows??
    // li has to have some id to find it here
    console.info('new vote', data);
});

///////////////////////////// UPLOADING /////////////////////////////

var FReader;
var fileName;

function fileChosen(e) {
    UI.selectedFile = e.target.files[0];
    document.getElementById('name-box').value = UI.selectedFile.name;
}

function startUpload() {
    fileName = UI.fileBox.value !== '';

    if (fileName) {

        FReader = new FileReader();

        fileName = document.getElementById('name-box').value;

        var Content = '<span id="name-area">Uploading ' + UI.selectedFile.name + ' as ' + fileName + '</span>';
        Content += '<div id="progress-container"><div id="progress-bar"></div></div><span id="percent">0%</span>';
        Content += '<span id="uploaded"> - <span id="kb">0</span>/' + Math.round(UI.selectedFile.size / ONE_KB) + 'KB</span>';

        document.getElementById('upload-area').innerHTML = Content;

        /**
         * Bind the read event to the socket event
         * Every time we read a chunk of the file, we send it to the server
         * @param  {Event} e [description]
         */
        FReader.onload = function (e) {
            socket.emit('upload', {
                name: fileName,
                data: e.target.result
            });
        };

        socket.emit('start upload', {
            name: fileName,
            size: UI.selectedFile.size
        });
    }
    else {
        alert('Please select a file to upload');
    }
}

/**
 * We send the file 100KB at a time, which is probably overkill
 * but we get a lovely, usable progress bar for the user in return
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
socket.on('more data', function (data) {
    UI.updateProgressBar(data.percent);

    //The Next Blocks Starting Position
    var marker = data.marker * HUNDRED_KB;
    var nextBlock = UI.selectedFile.slice(marker, marker + Math.min(HUNDRED_KB, (UI.selectedFile.size - marker)));

    FReader.readAsBinaryString(nextBlock);
});

socket.on('done', function (newFileName) {
    UI.addRow(name);
    UI.updateProgressBar(100);
});

socket.on('loading file list', function () {
    // TODO
    console.info('Spinner...');
});

/////////////////////////////// INIT ///////////////////////////////

function init() {

    socket.emit('init');

    if (window.File && window.FileReader) {
        document.getElementById('upload-button').addEventListener('click', startUpload);
        document.getElementById('file-box').addEventListener('change', fileChosen);
        document.getElementById('name-box').addEventListener('click', function () {
            document.getElementById('file-box').click();
        });
    }
}

window.addEventListener('load', init);
