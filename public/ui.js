/* global document, UI, util */

var UI = {

    USER_LOG_STYLE: 'color: lime; background-color: black; padding: 4px;',
    USER_WARN_STYLE: 'color: orange; background-color: black; padding: 4px;',
    USER_ERROR_STYLE: 'color: red; background-color: black; padding: 4px;',
    USER_INFO_STYLE: 'color: cyan; background-color: black; padding: 4px;',

    tunesContainer: document.getElementById('tunes-container'),
    fileBox: document.getElementById('file-box'),
    nameBox: document.getElementById('name-box'),
    uploadButton: document.getElementById('upload-button'),
    winningRow: null,
    playTime: document.getElementById('play-time'),
    rules: document.getElementById('rules'),

    selectedFile: null,

    updateProgressBar: function (percent) {

        if (percent < 0) {
            throw 'negative percent';
        }

        if (!this.selectedFile) {
            console.error('%cNo file selected', this.USER_ERROR_STYLE);
            return;
        }

        if (percent >= 100) {
            this.resetButton();
        }
        else {
            this.uploadButton.innerText = parseInt(percent, 10) + '%';
        }
    },

    cleanTunesList: function () {
        while (this.tunesContainer.firstChild) {
            this.tunesContainer.removeChild(this.tunesContainer.firstChild);
        }
    },

    playJingle: function(e, playButton, pauseButton, audioPlayer) {
        playButton.setAttribute('style', 'display:none');
        pauseButton.setAttribute('style', 'display:block');
        audioPlayer.play()
    },

    pauseJingle: function(e, playButton, pauseButton, audioPlayer) {
        pauseButton.setAttribute('style', 'display:none');
        playButton.setAttribute('style', 'display:block');
        audioPlayer.pause();
    },

    createTuneItem: function (tuneId, votes, listener) {

        // Score container
        var scoreContainer = document.createElement('span');
        var scoreText = document.createTextNode(votes);
        scoreContainer.className = 'tune-score';
        scoreContainer.appendChild(scoreText);

        // Vote button with label for each tune
        var voteBtn = document.createElement('a');
        voteBtn.className = 'button';
        voteBtn.addEventListener('click', listener);

        // Tune name
        var tuneNameContainer = document.createElement('span');
        tuneNameContainer.className = 'tune-name';
        var tuneName = document.createTextNode(tuneId.substring(0, tuneId.lastIndexOf('.')));
        tuneNameContainer.appendChild(tuneName);

        // Tune audio
        var tuneAudioContainer = document.createElement('div');
        var tuneAudio = document.createElement('audio');
        var tuneSource = document.createElement('source');
        tuneSource.setAttribute('src', 'tunes/' + tuneId);
        tuneSource.setAttribute('type', 'audio/mpeg');
        tuneAudio.appendChild(tuneSource);
        tuneAudio.setAttribute('controls', '');
        tuneAudio.setAttribute('style', 'display:none');
        tuneAudioContainer.appendChild(tuneAudio);
        tuneAudioContainer.className = 'tune-audio';

        // Play/ pause button with label for each tune
        var playButton = document.createElement('div');
        var pauseButton = document.createElement('div');

        playButton.setAttribute('class', 'play-button');
        pauseButton.setAttribute('class', 'pause-button');

        playButton.addEventListener('click', this.playJingle.bind(null, event, playButton, pauseButton, tuneAudio));
        pauseButton.addEventListener('click', this.pauseJingle.bind(null, event, playButton, pauseButton, tuneAudio));

        tuneAudio.addEventListener('ended', this.pauseJingle.bind(null, event, playButton, pauseButton, tuneAudio));

        // Container for each tune
        var tuneItem = document.createElement('li');
        tuneItem.setAttribute('data-tune-id', tuneId);
        tuneItem.className = 'tune-item';

        tuneItem.appendChild(scoreContainer);
        tuneItem.appendChild(tuneNameContainer);
        tuneItem.appendChild(tuneAudioContainer);
        tuneItem.appendChild(playButton);
        tuneItem.appendChild(pauseButton);
        tuneItem.appendChild(voteBtn);

        return tuneItem;
    },
    addRow: function (tuneId) {
        var tuneItem = this.createTuneItem(tuneId, 0);
        this.tunesContainer.appendChild(tuneItem);
    },
    resetButton: function () {
        this.uploadButton.innerText = 'Select File';
        this.nameBox.value = '';
        this.fileBox.value = '';
    }
};
