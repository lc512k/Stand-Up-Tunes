/* global UI */

// Class to add to winning row
var WINNER_STYLE = 'winner';

var util = {
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
     * TODO remove other characters as needed
     */
    safeifyString: function (unsafeString) {
        return unsafeString.replace(' ', '');
    }
};
