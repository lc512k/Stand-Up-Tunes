/* global document, UI, HTMLElement, socket */

var UI = {

    USER_LOG_STYLE: 'color: lime; background-color: black; padding: 4px;',
    USER_WARN_STYLE: 'color: orange; background-color: black; padding: 4px;',
    USER_ERROR_STYLE: 'color: red; background-color: black; padding: 4px;',
    USER_INFO_STYLE: 'color: cyan; background-color: black; padding: 4px;',

    // light blue
    SELECTED_COLOR: 'rgba(35, 112, 180, 0.2)',

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

    addItem: function (tuneId, listener) {
        var tuneItem = this.createTuneItem(tuneId, 0, listener);
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

            var audioElement = shadow.querySelectorAll('audio')[0];

            shadow.querySelectorAll('.play')[0].addEventListener('click', function () {
                audioElement.play();
            });

            shadow.querySelectorAll('.tune')[0].addEventListener('click', function (e) {

                // If clicked play button, ignore
                if (e.target.getAttribute('class') === 'play') {
                    return;
                }

                var otherElements = document.querySelectorAll('standup-tune');

                // TODO find alternative to poking shadow root of other elements
                for (var i = 0; i < otherElements.length; i++) {
                    var element = otherElements[i];
                    element.shadowRoot.querySelectorAll('.tune')[0].style.backgroundColor = '';
                }

                this.style.backgroundColor = UI.SELECTED_COLOR;

                var chosenTuneId = this.dataset.tuneId;

                if (chosenTuneId) {
                    socket.emit('vote', chosenTuneId);
                }
                else {
                    console.error('no tune id in ', e);
                }

            });
        };

        this.StandupTune = document.registerElement('standup-tune', {
            prototype: TuneProto
        });
    },

    createTuneItem: function (tuneId, votes) {
        var tuneElement = new this.StandupTune();

        // set the values in the light DOM
        tuneElement.querySelectorAll('tune-name')[0].innerText = tuneId;
        tuneElement.querySelectorAll('tune-voters')[0].innerText = votes;
        tuneElement.setAttribute('data-tune-id', tuneId);

        // TODO find alternative to poking the shadow DOM
        // Setting the tuneId where needed
        tuneElement.shadowRoot.querySelectorAll('.image')[0].style.backgroundImage = 'url(images/tunes/' + tuneId + '.png)';
        tuneElement.shadowRoot.querySelectorAll('source')[0].src = 'tunes/' + tuneId;
        tuneElement.shadowRoot.querySelectorAll('.tune')[0].setAttribute('data-tune-id', tuneId);

        return tuneElement;
    }
};
