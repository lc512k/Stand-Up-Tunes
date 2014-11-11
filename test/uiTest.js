/* global QUnit, UI, document */

// set up fake DOM elements
var setupUI = function () {
    UI.uploadButton = document.createElement('a');
    UI.uploadButton.setAttribute('id', 'upload-button');
    UI.selectedFile = 'someFile.mp3';
    UI.nameBox = document.createElement('input');
    UI.nameBox.setAttribute('id', 'name-box');
    UI.fileBox = document.createElement('input');
    UI.fileBox.setAttribute('id', 'file-box');
    UI.tunesContainer = document.createElement('ul');
    UI.tunesContainer.setAttribute('id', 'tunes-container');
    UI.tunesContainer.appendChild(document.createElement('li'));
    UI.tunesContainer.appendChild(document.createElement('li'));
};

var resetUI = function () {
    UI.uploadButton = null;
    UI.selectedFile = null;
    UI.nameBox = null;
    UI.fileBox = null;
    UI.tunesContainer = null;
};

// updateProgressBar
QUnit.test('UI updateProgressBar 34', function (assert) {
    setupUI();
    var percent = 34;

    // update the progress bar
    UI.updateProgressBar(percent);

    // button should say "34%"
    assert.strictEqual(0, UI.uploadButton.innerText.indexOf(percent));
    resetUI();
    resetUI();
});

QUnit.test('UI updateProgressBar negative', function (assert) {
    setupUI();
    var percent = -6;

    try {
        UI.updateProgressBar(percent);
    }
    catch (e) {
        assert.equal('negative percent', e);
    }
    resetUI();
});

QUnit.test('UI updateProgressBar 100', function (assert) {
    setupUI();
    var percent = 100;
    UI.updateProgressBar(percent);
    assert.equal('Select File',  UI.uploadButton.innerText);
    resetUI();
});

QUnit.test('UI updateProgressBar too large', function (assert) {
    setupUI();
    var percent = 150;
    UI.updateProgressBar(percent);
    assert.equal('Select File',  UI.uploadButton.innerText);
    resetUI();
});

// cleanTunesList

QUnit.test('UI cleanTunesList', function (assert) {
    setupUI();
    UI.cleanTunesList();
    assert.strictEqual(0, UI.tunesContainer.childNodes.length);
    resetUI();
});

// createTuneItem

QUnit.test('UI createTuneItem', function (assert) {
    setupUI();
    var tuneId = 'some-id';
    var votes = '34';
    var newItem = UI.createTuneItem(tuneId, votes);
    //TODO add check for audio and name
    assert.strictEqual(tuneId, newItem.getAttribute('data-tune-id'));
    assert.strictEqual(votes, newItem.firstChild.innerText);
    resetUI();
});

// addRow

QUnit.test('UI addRow', function (assert) {
    setupUI();
    var tuneId = 'unique-id';
    UI.addRow(tuneId);
    assert.strictEqual('unique-id', UI.tunesContainer.lastChild.getAttribute('data-tune-id'));
    resetUI();
});

// resetUploadButton

QUnit.test('UI resetUploadbutton', function (assert) {
    setupUI();
    UI.resetButton();
    assert.strictEqual('Select File', UI.uploadButton.innerText);
    assert.strictEqual('', UI.nameBox.value);
    assert.strictEqual('', UI.fileBox.value);
    resetUI();
});
