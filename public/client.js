/* global window, document, io, FileReader */

var socket          = io();

// FILE SIZE CONSTANTS
var HALF_MB         = 524288;
var ONE_MB          = HALF_MB  * 2;
var ONE_KB          = ONE_MB / 1024;
var HUNDRED_KB      = ONE_KB * 100;

///////////////////////////////// UI /////////////////////////////////

var UI = {
    tunesContainer: document.getElementById('tunes-container'),
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
    }
};

/////////////////////////////// VOTING ///////////////////////////////

/**
 * Event handler for Vote button
 * When the user clicks a vote button for a tune
 * send the tuneId to the server
 * @param  {Event} e [description]
 */
function onCastVote(e) {
    var voteButton    = e.currentTarget;
    var tuneContainer = voteButton.parentNode;
    var chosenTuneId  = tuneContainer.dataset.tuneId;

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
    console.info('new vote', data);
    alert('new vote');
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

socket.on('done', function () {
    UI.updateProgressBar(100);
});

socket.on('loading file list', function () {
    // TODO
    console.info('Spinner...');
});

socket.on('tunes list', function (data) {
    console.info('tunes list data', data);
    for (var i = 0; i < data.tuneIds.length; i++) {

        // Vote button for each tune
        var tuneBtn = document.createElement('button');
        var tuneName = document.createTextNode('tune ' + data.tuneIds[i]);
        tuneBtn.appendChild(tuneName);
        tuneBtn.addEventListener('click', onCastVote);

        // Container for each tune
        var tuneDiv = document.createElement('div');
        tuneDiv.setAttribute('data-tune-id', data.tuneIds[i]);
        tuneDiv.appendChild(tuneBtn);

        UI.tunesContainer.appendChild(tuneDiv);
    }
});

/////////////////////////////// INIT ///////////////////////////////

function init () {

    socket.emit('init');

    if (window.File && window.FileReader) {
        document.getElementById('upload-button').addEventListener('click', startUpload);
        document.getElementById('file-box').addEventListener('change', fileChosen);
    }
    else {
        document.getElementById('upload-area').innerHTML = 'Your Browser Doesn\'t Support The File API Please Update Your Browser';
    }
}

window.addEventListener('load', init);
