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

    playJingle: function (e, playButton, pauseButton, audioPlayer) {
        playButton.setAttribute('style', 'display:none');
        pauseButton.setAttribute('style', 'display:block');
        audioPlayer.play();
    },

    pauseJingle: function (e, playButton, pauseButton, audioPlayer) {
        pauseButton.setAttribute('style', 'display:none');
        playButton.setAttribute('style', 'display:block');
        audioPlayer.pause();
    },

    addRow: function (tuneId) {
        var tuneItem = this.createTuneItem(tuneId, 0);
        this.tunesContainer.appendChild(tuneItem);
    },
    resetButton: function () {
        this.uploadButton.innerText = 'Select File';
        this.nameBox.value = '';
        this.fileBox.value = '';
    },
    registerCustomElements: function () {

        var TuneProto = Object.create(HTMLElement.prototype);
        var NameProto = Object.create(HTMLElement.prototype);
        var ImageProto = Object.create(HTMLElement.prototype);
        var VotersProto = Object.create(HTMLElement.prototype);

        VotersProto.createdCallback = function () {
            this.StandupTune = document.registerElement('tune-voters', {
                prototype: VotersProto
            });
        };

        ImageProto.createdCallback = function () {
            this.StandupTune = document.registerElement('tune-image', {
                prototype: ImageProto
            });
        };

        NameProto.createdCallback = function () {
            this.StandupTune = document.registerElement('tune-name', {
                prototype: NameProto
            });
        };

        TuneProto.createdCallback = function () {

            // TODO template this
            this.innerHTML =
                '<tune-name></tune-name>'  +
                '<tune-voters></tune-voters>';

            var shadow = this.createShadowRoot();
            var importLink = document.querySelector('link[rel="import"]').import;
            var template = importLink.querySelector('template');
            var clone = document.importNode(template.content, true);

            shadow.appendChild(clone);

            var audioElement = shadow.getElementsByTagName('audio')[0];

            shadow.getElementsByClassName('play')[0].addEventListener('click', function () {
                audioElement.play();
            });
        };

        this.StandupTune = document.registerElement('standup-tune', {
            prototype: TuneProto
        });
    },

    createTuneItem: function (tuneId, votes, listener, background) {
        var tuneElement = new this.StandupTune();
        tuneElement.getElementsByTagName('tune-name')[0].innerText = tuneId;
        tuneElement.getElementsByTagName('tune-voters')[0].innerText = votes;

        // poke the shadow to style the background
        tuneElement.shadowRoot.getElementsByClassName('image')[0].style.backgroundImage = 'url(images/tunes/' + tuneId + '.png)';
        tuneElement.shadowRoot.getElementsByTagName('source')[0].src = 'tunes/' + tuneId;

        tuneElement.setAttribute('data-tune-id', tuneId);
        tuneElement.addEventListener('click', listener);
        return tuneElement;
    }
};
