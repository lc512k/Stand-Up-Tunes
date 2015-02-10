var debug = require('debug')('cron');
var CronJob = require('cron').CronJob;

exports.set = function (command, playTime, type) {

    var onComplete = null;
    var startNow = true;
    var timezone = 'Europe/London';

    var cronJob = new CronJob(playTime, command, onComplete, startNow, timezone);

    var message = 'Cron job set at ' + playTime;

    message += type ? ' for ' + type : '';

    debug(message, cronJob.cronTime.source);
};
