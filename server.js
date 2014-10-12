var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendfile('public/index.html');
    var filepath;

    console.log('req.url', req.url);
    if (req.url === '/') {
        filepath = 'public/index.html';
    }
    else {
        filepath = 'public' + req.url;
    }

    res.sendfile(filepath);
});

io.on('connection', function (socket) {
    socket.on('chat message', function (msg) {
        console.log('message', msg);
        io.emit('chat message', msg + ' back to you');
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});
