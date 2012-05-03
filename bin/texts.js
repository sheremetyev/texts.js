#!/usr/bin/env node

var io = require('../lib/io');
var xelatex = require('../lib/writer/xelatex');
var html5 = require('../lib/writer/html5');

io.readInput(function (err, input) {
  var text = JSON.parse(input);
  var output = html5(text);
  io.writeOutput(output);
});
