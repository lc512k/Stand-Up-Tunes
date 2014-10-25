/* global window, document, FileReader, io */

var socket = io();

// FILE SIZE CONSTANTS
var ONE_KB = 1024;
var HUNDRED_KB = ONE_KB * 100;
var USER_LOG_STYLE = 'color: lime; background-color: black; padding: 4px;';
var USER_WARN_STYLE = 'color: orange; background-color: black; padding: 4px;';
var USER_ERROR_STYLE = 'color: red; background-color: black; padding: 4px;';
var USER_INFO_STYLE = 'color: cyan; background-color: black; padding: 4px;';

///////////////////////////////// DOM /////////////////////////////////

var DOM = {
    
};

///////////////////////////////// UI /////////////////////////////////

var UI = {
    tunesContainer: document.getElementById('tunes-container'),
    fileBox: document.getElementById('file-box'),
    nameBox: document.getElementById('name-box'),
    uploadButton: document.getElementById('upload-button'),

    selectedFile: null,

    updateProgressBar: function (percent) {

        if (!this.selectedFile) {
            console.error('%cNo file selected', USER_ERROR_STYLE);
            return;
        }

        if (percent >= 100) {
            UI.resetUploadButton();
        }
        else {
            UI.uploadButton.innerText = parseInt(percent) + '%';
        }    
    },

    cleanTunesList: function () {
        while (this.tunesContainer.firstChild) {
            this.tunesContainer.removeChild(this.tunesContainer.firstChild);
        }
    },

    createTuneItem: function (tuneId, votes) {

        // Score container
        var scoreContainer = document.createElement('span');
        var scoreText = document.createTextNode(votes);
        scoreContainer.className = 'tune-score';
        scoreContainer.appendChild(scoreText);

        // Vote button with label for each tune
        var voteBtn = document.createElement('a');
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
        tuneSource.setAttribute('src', 'tunes/' + tuneId);
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
        var tuneItem = this.createTuneItem(tuneId, 0);
        UI.tunesContainer.appendChild(tuneItem);
    },
    resetUploadButton: function() {
        UI.uploadButton.innerText = 'Select File';
        UI.nameBox.value = '';
    }
};

// INIT

socket.on('tunes list', function (files) {
    UI.cleanTunesList();

    for (var fileId in files) {
        var tuneItem = UI.createTuneItem(fileId, files[fileId].votes);
        UI.tunesContainer.appendChild(tuneItem);
    }
});

socket.on('welcome', function (ip) {
    console.log('%cWelcome,%s', USER_LOG_STYLE, ip);
});
socket.on('new user', function (ip) {
    console.log('%cYour friend%shas joined!', USER_LOG_STYLE, ip);
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
        console.error('><');
    }
}

/**
 * Server message listener
 * The server emits 'new vote' every time it receives a 'vote'
 * Update the UI with the new vote count
 * @param {Object} vote
 * @param {String} vote.tuneId
 * @param {String} vote.count
 */
socket.on('new vote', function (vote) {

    // Find the tune in the list and update the vote count
    for (var i = 0; i < UI.tunesContainer.childNodes.length; i ++) {

        var thisItem = UI.tunesContainer.childNodes[i];

        if (thisItem.dataset.tuneId === vote.tuneId) {
            thisItem.childNodes[0].innerText = vote.count;
        }
    }
});

///////////////////////////// UPLOADING /////////////////////////////

var fileReader;
var fileName;

function fileChosen(e) {
    UI.selectedFile = e.target.files[0];
    UI.nameBox.value = UI.selectedFile.name;
    UI.uploadButton.innerText = 'Upload!';
}

function startUpload() {
    fileName = UI.fileBox.value;

    // User hasn't selected a file yet,
    // trigger the file-box and abort
    if (!fileName) {
        UI.fileBox.click();
        return;
    }

    // Remove HTML5 fakepath
    fileName = fileName.replace('C:\\fakepath\\', '');

    // File is not .mp3 or .wav, abort
    if (fileName.indexOf('.mp3') < 0 && fileName.indexOf('.wav') < 0) {
        console.log('%cThat ain\'t no audio file. Try again.', USER_WARN_STYLE);
        UI.resetUploadButton();
        return;
    }

    fileReader = new FileReader();

    console.log('%cFile size is%iKB', USER_INFO_STYLE, Math.round(UI.selectedFile.size / ONE_KB));

    UI.uploadButton.innerText = '0%';

    /**
     * Bind the read event to the socket event
     * Every time we read a chunk of the file, we send it to the server
     * @param  {Event} e [description]
     */
    fileReader.onload = function (e) {
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

    fileReader.readAsBinaryString(nextBlock);
});

socket.on('done', function (newFileName) {
    UI.addRow(newFileName);
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
        UI.fileBox.addEventListener('change', fileChosen);
        UI.nameBox.addEventListener('click', function () {
            UI.fileBox.click();
        });
    }
}

window.addEventListener('load', init);
