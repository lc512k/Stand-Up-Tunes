/* global window, document, io, FileReader */

var voteButtons = document.getElementsByClassName('js-vote');
var socket      = io();

var HALF_MB    = 524288;
var ONE_MB     = HALF_MB  * 2;
var ONE_KB     = ONE_MB / 1024;
var HUNDRED_KB = ONE_KB * 100;

function castVote(e) {

    var chosenTune   = e.currentTarget;
    var chosenTuneId = chosenTune.dataset.tuneId;

    if (chosenTuneId) {
        socket.emit('vote', chosenTuneId);
    }
    else {
        console.error('no tuneId for', chosenTune);
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
        Content += '<span id="uploaded"> - <span id="MB">0</span>/' + Math.round(selectedFile.size / ONE_KB) + 'KB</span>';

        document.getElementById('upload-area').innerHTML = Content;
        FReader.onload = function (evnt) {
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

function updateBar(percent) {
    document.getElementById('progress-bar').style.width = percent + '%';
    document.getElementById('percent').innerHTML = (Math.round(percent * 100) / 100) + '%';
    var kilobitesDone = Math.round(((percent / 100.0) * selectedFile.size) / ONE_KB);
    document.getElementById('MB').innerHTML = kilobitesDone;
}

/**
 * We send the file 100KB at a time, which is terribly wasteful in terms of network resources
 * but absolutely beautiful for updating a nice, usable progress bar
 * TODO: Send the whole file and let the server write it to disk 100KB at a time
 * and tell us about each chunk
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
socket.on('more data', function (data) {
    updateBar(data.percent);
    var marker = data.marker * HUNDRED_KB; //The Next Blocks Starting Position
    var nextBlock = selectedFile.slice(marker, marker + Math.min(HUNDRED_KB, (selectedFile.size - marker)));

    FReader.readAsBinaryString(nextBlock);
});

socket.on('done', function () {
    updateBar(100);
});

function init () {
    for (var i = 0; i < voteButtons.length; i++) {
        voteButtons[i].addEventListener('click', castVote);
    }
    if (window.File && window.FileReader) {
        document.getElementById('upload-button').addEventListener('click', startUpload);
        document.getElementById('file-box').addEventListener('change', fileChosen);
    }
    else {
        document.getElementById('upload-area').innerHTML = 'Your Browser Doesn\'t Support The File API Please Update Your Browser';
    }
}

window.addEventListener('load', init);
