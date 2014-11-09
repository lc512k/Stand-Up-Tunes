var debug = require('debug')('cron');
var CronJob = require('cron').CronJob;

var standupTime = '0 38 9 * * 1-5';

// Test vars
var everyMinute = '0 * * * * *';

exports.init = function (command, playTime) {

    var onComplete = null;
    var startNow = true;
    var timezone = 'Europe/London';

    var cronJob = new CronJob(playTime || standupTime, command, onComplete, startNow, timezone);

    debug('Job set: ' + cronJob.cronTime.source);
};

exports.getPlayTime = function () {
    return expresionToTime(standupTime);
};

var expresionToTime = function (cronExpression) {

    // TODO don't cheat :P
    return '9:38 am';
};
