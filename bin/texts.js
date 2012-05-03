#!/usr/bin/env node

var nopt = require('nopt');
var options = {
  'help': Boolean,
  'from' : [ 'textjson' ],
  'to' : [ 'xelatex', 'html5' ],
};
var shorthands = {
  'h' : '--help',
  'f' : '--from',
  't' : '--to',
};
var parsed = nopt(options, shorthands);

if (parsed.help) {
  console.log([
    'Usage: texts [OPTIONS] [FILES]',
    '',
    'Options:',
    '  -f FORMAT             --from=FORMAT',
    '  -t FORMAT             --to=FORMAT',
    '  -h                    --help',
  ].join('\n'));
  process.exit(1);
}

parsed.from = parsed.from || 'textjson';
parsed.to   = parsed.to   || 'html5';

// option parsing completed

var io = require('../lib/io');
var fs = require('fs');
var reader = require('../lib/reader/' + parsed.from);
var writer = require('../lib/writer/' + parsed.to);

if (parsed.argv.remain.length) {
  // process files
  parsed.argv.remain.forEach(function(inputFile) {
    var input = fs.readFileSync(inputFile);
    var text = reader(input);
    var output = writer(text);
    io.writeOutput(output);
  });
} else {
  // process stdin
  io.readInput(function (err, input) {
    var text = reader(input);
    var output = writer(text);
    io.writeOutput(output);
  });
}
