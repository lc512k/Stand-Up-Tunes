/* global QUnit, util, UI */

QUnit.test('Util safeifyString both', function (assert) {
    var safe = util.safeifyString(' I:have it /all:');
    console.log(safe);

    // Ideal test would be to get afplay to play it
    // Doing this instead
    var colon = safe.indexOf(':');
    var space = safe.indexOf(' ');
    var slash = safe.indexOf('/');
    assert.equal(colon, -1);
    assert.equal(space, -1);
    assert.equal(slash, -1);
});

QUnit.test('Util makeStandard', function (assert) {
    var fakeRow = UI.createTuneItem('test-id', '1');
    fakeRow.className += 'something and winner';
    util.makeStandard(fakeRow);
    var newClass = fakeRow.className;
    assert.equal(newClass, 'tune-item');
});

QUnit.test('Util makeWinner', function (assert) {
    var fakeRow = UI.createTuneItem('test-id', '1');
    util.makeWinner(fakeRow);
    var newClass = fakeRow.className;
    assert.equal(newClass, 'tune-item winner');
});
