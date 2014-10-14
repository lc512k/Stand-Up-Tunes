/* global window, document, io, FileReader */

var voteButtons = document.getElementsByClassName('js-vote');
var socket      = io();

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
        Content += '<span id="uploaded"> - <span id="MB">0</span>/' + Math.round(selectedFile.size / 1048576) + 'MB</span>';

        document.getElementById('upload-area').innerHTML = Content;
        FReader.onload = function (evnt) {
            console.info('evnt', evnt, evnt.target, evnt.target.result);
            //alert('data client');
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
    var MBDone = Math.round(((percent / 100.0) * selectedFile.size) / 1048576);
    document.getElementById('MB').innerHTML = MBDone;
}

socket.on('more data', function (data) {
    //alert('more data');
    updateBar(data.percent);
    var place = data.place * 524288; //The Next Blocks Starting Position
    var newFile; //The Variable that will hold the new Block of Data

    newFile = selectedFile.slice(place, place + Math.min(524288, (selectedFile.size - place)));

    console.info('newFile', newFile);

    FReader.readAsBinaryString(newFile);
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
