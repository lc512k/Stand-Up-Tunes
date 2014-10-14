/* global window, document, io, FileReader */

var tunesContainer  = document.getElementById('tunes-container');
var socket          = io();

var HALF_MB         = 524288;
var ONE_MB          = HALF_MB  * 2;
var ONE_KB          = ONE_MB / 1024;
var HUNDRED_KB      = ONE_KB * 100;

function castVote(e) {

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

// Whenever the server emits 'new message', update the chat body
socket.on('new vote', function (data) {
    console.info('data', data);
    alert('someone voted');
});

/**
 * Uploading files
 */

var selectedFile;

function fileChosen(evnt) {
    selectedFile = evnt.target.files[0];
    document.getElementById('name-box').value = selectedFile.name;
}

var FReader;
var name;

function startUpload() {
    if (document.getElementById('file-box').value !== '') {

        FReader = new FileReader();

        name = document.getElementById('name-box').value;

        var Content = '<span id="name-area">Uploading ' + selectedFile.name + ' as ' + name + '</span>';
        Content += '<div id="progress-container"><div id="progress-bar"></div></div><span id="percent">0%</span>';
        Content += '<span id="uploaded"> - <span id="kb">0</span>/' + Math.round(selectedFile.size / ONE_KB) + 'KB</span>';

        document.getElementById('upload-area').innerHTML = Content;

        /**
         * Bind the read event to the socket event
         * Every time we read a chunk of the file, we send it to the server
         * @param  {Event} evnt [description]
         */
        FReader.onload = function (evnt) {
            alert('onload');
            socket.emit('upload', {
                name: name,
                data: evnt.target.result
            });
        };

        socket.emit('start upload', {
            name: name,
            size: selectedFile.size
        });
    }
    else {
        alert('Please select a file to upload');
    }
}

function updateProgressBar(percent) {
    document.getElementById('progress-bar').style.width = percent + '%';
    document.getElementById('percent').innerHTML = (Math.round(percent * 100) / 100) + '%';
    var kilobitesDone = Math.round(((percent / 100.0) * selectedFile.size) / ONE_KB);
    document.getElementById('kb').innerHTML = kilobitesDone;
}

/**
 * We send the file 100KB at a time, which is probably overkill
 * but we get a lovely, usable progress bar for the user in return
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
socket.on('more data', function (data) {
    updateProgressBar(data.percent);

    //The Next Blocks Starting Position
    var marker = data.marker * HUNDRED_KB;
    var nextBlock = selectedFile.slice(marker, marker + Math.min(HUNDRED_KB, (selectedFile.size - marker)));

    FReader.readAsBinaryString(nextBlock);
});

socket.on('done', function () {
    updateProgressBar(100);
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
        tuneBtn.addEventListener('click', castVote);

        // Container for each tune
        var tuneDiv = document.createElement('div');
        tuneDiv.setAttribute('data-tune-id', data.tuneIds[i]);
        tuneDiv.appendChild(tuneBtn);

        tunesContainer.appendChild(tuneDiv);
    }
});

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
