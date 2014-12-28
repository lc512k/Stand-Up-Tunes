var debug = require('debug')('cron');
var CronJob = require('cron').CronJob;

var standupTime = '0 50 9 * * 1-5';

// Test var: jingle every minute
// var standupTime = '0 * * * * *';

exports.init = function (command, playTime) {

    var onComplete = null;
    var startNow = true;
    var timezone = 'Europe/London';

    var cronJob = new CronJob(playTime || standupTime, command, onComplete, startNow, timezone);

    debug('Job set: ' + cronJob.cronTime.source);
};
