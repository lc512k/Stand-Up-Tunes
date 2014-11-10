/* global QUnit, UI, document */

// set up fake DOM elements
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

// updateProgressBar
QUnit.test('UI updateProgressBar 34', function (assert) {
    var percent = 34;

    // update the progress bar
    UI.updateProgressBar(percent);

    // button should say "34%"
    assert.strictEqual(0, UI.uploadButton.innerText.indexOf(percent));
});

QUnit.test('UI updateProgressBar negative', function (assert) {
    var percent = -6;

    try {
        UI.updateProgressBar(percent);
    }
    catch (e) {
        assert.equal('negative percent', e);
    }
});

QUnit.test('UI updateProgressBar 100', function (assert) {
    var percent = 100;
    UI.updateProgressBar(percent);
    assert.equal('Select File',  UI.uploadButton.innerText);
});

QUnit.test('UI updateProgressBar too large', function (assert) {
    var percent = 150;
    UI.updateProgressBar(percent);
    assert.equal('Select File',  UI.uploadButton.innerText);
});

// cleanTunesList

QUnit.test('UI cleanTunesList', function (assert) {
    UI.cleanTunesList();
    assert.strictEqual(0, UI.tunesContainer.childNodes.length);
});

// createTuneItem

QUnit.test('UI createTuneItem', function (assert) {
    var tuneId = 'some-id';
    var votes = 34;
    UI.createTuneItem(tuneId, votes);
    assert.ok();
});

// addRow

QUnit.test('UI addRow', function (assert) {
    var tuneId = 'some-id';
    UI.addRow(tuneId);
    assert.ok();
});

QUnit.test('UI addRow duplicates', function (assert) {
    var tuneId = 'some-duplicate-id';
    UI.addRow(tuneId);
    UI.addRow(tuneId);
    assert.ok();
});

// resetUploadButton

QUnit.test('UI resetUploadbutton', function (assert) {

    UI.resetUploadbutton();
    assert.ok();
});
