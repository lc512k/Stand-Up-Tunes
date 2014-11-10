/* global UI, util, io, document, window */

var socket = io();

// FILE SIZE CONSTANTS
var ONE_KB = 1024;
var HUNDRED_KB = ONE_KB * 100;

// Current winning vote count
var highScore = 0;

// INIT
socket.on('startup', function (message) {

    var files = message.files;

    var playTime = message.playTime;

    UI.playTime.innerText = playTime;

    UI.cleanTunesList();

    for (var fileId in files) {

        var thisVoteCount = files[fileId].votes;

        var tuneItem = UI.createTuneItem(fileId, thisVoteCount, onCastVote);

        UI.tunesContainer.appendChild(tuneItem);

        highlightIfWinner(tuneItem, thisVoteCount);
    }
});

socket.on('welcome', function (ip) {
    console.log('%cWelcome,%s', UI.USER_LOG_STYLE, ip);
});

socket.on('new user', function (ip) {
    console.log('%cYour friend%shas joined!', UI.USER_LOG_STYLE, ip);
});

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
    for (var i = 0; i < UI.tunesContainer.childNodes.length; i++) {

        var thisItem = UI.tunesContainer.childNodes[i];

        if (thisItem.dataset.tuneId === vote.tuneId) {
            highlightIfWinner(thisItem, vote.count);
            thisItem.childNodes[0].innerText = vote.count;
        }
    }
});

/**
 * Server message listener
 * The server emits 'vote reset' every morning after standup
 * All votes are back to zero if the jingle played successfully
 * @param {Object} vote
 * @param {String} vote.tuneId
 * @param {String} vote.count
 */
socket.on('votes reset', function () {

    var allScores = document.getElementsByClassName('tune-score');

    for (var i = 0; i < allScores.length; i++) {
        allScores[i].innerText = 0;
    }

    highScore = 0;

    // Remove badge from previous winner
    if (UI.winningRow) {
        UI.winningRow.className = 'tune-item';
    }
});

var highlightIfWinner = function (rowItem, voteCount) {

    if (voteCount > highScore) {

        highScore = voteCount;

        // Remove badge from previous winner
        util.makeStandard(UI.winningRow);

        // Crown new winner
        util.makeWinner(rowItem);

    }
};

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

    // Clean it up
    fileName = util.safeifyString(fileName);

    // File is not .mp3 or .wav, abort
    if (fileName.indexOf('.mp3') < 0 && fileName.indexOf('.wav') < 0) {
        console.log('%cThat ain\'t no audio file. Try again.', UI.USER_WARN_STYLE);
        UI.resetUploadButton();
        return;
    }

    fileReader = new FileReader();

    console.log('%cFile size is%iKB', UI.USER_INFO_STYLE, Math.round(UI.selectedFile.size / ONE_KB));

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
    // TODO spinner
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
