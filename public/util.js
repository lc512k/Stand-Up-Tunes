/* global UI */

// Class to add to winning row
var WINNER_STYLE = 'winner';

var util = {

    // When was the last vote fired?
    lastTimestamp: Date.now(),

    /**
     * Make any row a standard row
     * @param  {DOM node} row
     */
    makeStandard: function (row) {
        if (row) {
            row.className = 'tune-item';
        }
    },

    /**
     * Make any row a winner row
     * @param  {DOM node} row
     */
    makeWinner: function (row) {
        if (row) {
            row.className = row.className + ' ' + WINNER_STYLE;
            UI.winningRow = row;
        }
    },

    /**
     * Remove unsafe characters from a string
     * afplay can't handle spaces
     */
    safeifyString: function (unsafeString) {
        var find = '[ :/]';
        var pattern = new RegExp(find, 'g');
        var safe = unsafeString.replace(pattern, '');
        return safe;
    },

    /**
     * Drop a vote that happened too soon after the last one
     */
    shouldDrop: function () {

        var timestamp = Date.now();

        if (timestamp - this.lastTimestamp < 100) {
            return true;
        }

        this.lastTimestamp = timestamp;
        return false;
    }
};
