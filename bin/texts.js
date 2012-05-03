#!/usr/bin/env node

var nopt = require('nopt');
var options = {
  'help': Boolean,
  'to' : [ 'xelatex', 'html5' ],
};
var shorthands = {
  'h' : '--help',
  't' : '--to',
};
var parsed = nopt(options, shorthands);

if (parsed.help) {
  console.log([
    'Usage: texts [OPTIONS] [FILES]',
    '',
    'Options:',
    '  -t FORMAT             --to=FORMAT',
    '  -h                    --help',
  ].join('\n'));
  process.exit(1);
}

parsed.to = parsed.to || 'html5';

// option parsing completed

var io = require('../lib/io');
var fs = require('fs');
var writer = require('../lib/writer/' + parsed.to);

if (parsed.argv.remain.length) {
  // process files
  parsed.argv.remain.forEach(function(inputFile) {
    var input = fs.readFileSync(inputFile);
    var text = JSON.parse(input);
    var output = writer(text);
    io.writeOutput(output);
  });
} else {
  // process stdin
  io.readInput(function (err, input) {
    var text = JSON.parse(input);
    var output = writer(text);
    io.writeOutput(output);
  });
}
