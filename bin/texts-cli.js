#!/usr/bin/env node

var io = require('../lib/io');
var xelatex = require('../lib/writer/xelatex');

io.readInput(function (err, input) {
  var text = JSON.parse(input);
  var tex = xelatex(text);
  io.writeOutput(tex);
});
