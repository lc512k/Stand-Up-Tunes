var express = require('express');
var app = express();
var http = require('http');
var debug = require('debug')('server');
var server = http.createServer(app).listen(3000);

// define POST api to change sh file and return OK or error