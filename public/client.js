/* global UI, util, io, navigator, document, window */

var socket = io();

// FILE SIZE CONSTANTS
var ONE_KB = 1024;
var HUNDRED_KB = ONE_KB * 100;
var ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
var COOKIE_NAME = 'play_fair';

// Current winning vote count
var highScore = 0;

// INIT
socket.on('startup', function (message) {

    var files = message.files;

    var playTime = message.playTime;

    UI.playTime.innerText = playTime;

    UI.cleanTunesList();

    for (var fileId in files) {

        var thisVoteCount = files[fileId];

        var tuneItem = UI.createTuneItem(fileId, thisVoteCount);

        UI.tunesContainer.appendChild(tuneItem);

        highlightIfWinner(tuneItem, thisVoteCount);
    }
});

socket.on('welcome', function (name) {
    console.log('%c%s%s', UI.USER_LOG_STYLE, 'welcome', name);
});

/////////////////////////////// VOTING ///////////////////////////////

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
            // append all user images. server sends photo urls
            thisItem.getElementsByTagName('tune-voters')[0].innerText = vote.count;
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
 * @deprecated
 */
socket.on('votes reset', function () {

    console.warn('deprecated event "votes reset" called');

    var allScores = document.getElementsByClassName('voters');

    for (var i = 0; i < allScores.length; i++) {
        allScores[i].innerText = 0;
    }

    highScore = 0;

    // Remove badge from previous winner
    if (UI.winningRow) {
        UI.winningRow.className = 'tune-item';
    }
});

socket.on('winner', function (winner) {
    UI.updateWinner(winner);
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
    if (fileName.indexOf('.mp3') < 0 && fileName.indexOf('.wav') < 0 && fileName.indexOf('.m4v') < 0 && fileName.indexOf('.m4a') < 0) {
        alert('Wrong file type for ' + fileName);
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
    UI.addItem(newFileName);
    UI.updateProgressBar(100);
});

socket.on('loading file list', function () {
    // TODO spinner
});

//// INIT

// Redirect to https
if (window.location.href.indexOf('192.168') > 0) {
    window.location.replace('https://dev5.mshoteu.badoo.com/');
}

function init() {
    var d = new Date();
    d.setTime(d.getTime() + ONE_YEAR);

    if (document.cookie.indexOf(COOKIE_NAME) < 0) {
        document.cookie = COOKIE_NAME + '=' + makeid() + '; expires=' + d.toUTCString();
    }

    socket.emit('init', getCookie(COOKIE_NAME));

    if (window.File && window.FileReader) {
        document.getElementById('upload-button').addEventListener('click', startUpload);
        UI.fileBox.addEventListener('change', fileChosen);
        UI.nameBox.addEventListener('click', function () {
            UI.fileBox.click();
        });
    }

    // Web
    UI.registerCustomElements();

    // Service Worker
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
        console.log('Service worker registered! ◕‿◕', reg);
    }, function (err) {
        console.log('Sevice worker failed to register ಠ_ಠ', err);
    });

    // chrome://flags/#enable-experimental-web-platform-features
    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {

        if (!serviceWorkerRegistration.pushManager) {
            console.warn('Push not Supported');
            return;
        }

        serviceWorkerRegistration.pushManager.subscribe(/*{userVisibleOnly: true}*/).then(function (pushSubscription) {
            socket.emit('pushSubscription', pushSubscription);
        }).catch(function (e) {
            console.log('Unable to register for push', e);
        });

        //https://www.chromestatus.com/feature/5778950739460096
        //https://code.google.com/p/chromium/issues/detail?id=477401
        var servicePromise = serviceWorkerRegistration.pushManager.permissionState ?
                            serviceWorkerRegistration.pushManager.permissionState() :
                            serviceWorkerRegistration.pushManager.hasPermission();

        // Check if we have permission for push messages already
        servicePromise.then(function (pushPermissionStatus) {

            if (pushPermissionStatus !== 'granted') {
                console.log('no push permissions yet');
                return;
            }
            // We have permission,
            // so let's update the subscription
            // just to be safe
            serviceWorkerRegistration.pushManager.getSubscription().then(function (pushSubscription) {
                if (pushSubscription) {} else {}
            });
        }).catch(function (error) {
            console.error(error);
        });
    });
}

window.addEventListener('load', init());
