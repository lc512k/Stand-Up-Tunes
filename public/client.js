/* global UI, navigator, util, io, document, window */

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

        var thisVoteCount = files[fileId];

        var tuneItem = UI.createTuneItem(fileId, thisVoteCount);

        UI.tunesContainer.appendChild(tuneItem);

        highlightIfWinner(tuneItem, thisVoteCount);
    }
});

socket.on('welcome', function (name) {
    console.log('%c%s%s', UI.USER_LOG_STYLE, 'welcome', name);
});

socket.on('authenticate', function () {
    // tell them to login via fb

    socket.emit('login', {name: 'offline'});
    socket.emit('init');
});

socket.on('new user', function (ip) {
    console.log('%cYour friend%shas joined!', UI.USER_LOG_STYLE, ip);
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
 */
socket.on('votes reset', function () {

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

socket.on('winner', function (winners) {
    for (var winnerIp in winners) {
        console.log('%c%s wins!', winnerIp);
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
    if (fileName.indexOf('.mp3') < 0 && fileName.indexOf('.wav') < 0 && fileName.indexOf('.m4v') < 0 && fileName.indexOf('.m4a') < 0) {
        alert('Wrong file type for '+ fileName);
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

    // Web
    UI.registerCustomElements();

    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
        .then(function (reg) {
            console.log('Service worker registered! ◕‿◕', reg);
        }, function (err) {
            console.log('Sevice worker failed to register ಠ_ಠ', err);
        });

        // chrome://flags/#enable-experimental-web-platform-features
        navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {

            //Check if this service worker supports push
            if (!serviceWorkerRegistration.pushManager) {
                console.warn('Ooops Push Isn\'t Supported', 'This is most likely ' +
                'down to the current browser doesn\'t have support for push. ' +
                'Try Chrome M41.');
                return;
            }

            serviceWorkerRegistration.pushManager.subscribe().then(function (pushSubscription) {
                socket.emit('pushSubscription', pushSubscription);
            }).catch(function (e) {
                console.log('Unable to register for push', e);
            });


            // Check if we have permission for push messages already
            serviceWorkerRegistration.pushManager.hasPermission().then(
            function (pushPermissionStatus) {

                // If we don't have permission then set the UI accordingly
                if (pushPermissionStatus !== 'granted') {
                    console.log('no push permissions yet');
                    return;
                }
                // We have permission,
                // so let's update the subscription
                // just to be safe
                serviceWorkerRegistration.pushManager.getSubscription().then(
                function (pushSubscription) {
                    // Check if we have an existing pushSubscription
                    if (pushSubscription) {
                        // sendSubscription(pushSubscription);
                        // changeState(STATE_ALLOW_PUSH_SEND);
                    }
                    else {
                        //changeState(STATE_NOTIFICATION_PERMISSION);
                    }
                });
            });
        });
    }
}

window.addEventListener('load', init);
