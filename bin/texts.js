#!/usr/bin/env node

var nopt = require('nopt');
var options = {
  'help': Boolean,
  'from' : [ 'textjson', 'text' ],
  'to' :   [ 'textjson', 'xelatex', 'html5' ],
  'standalone' : Boolean,
};
var shorthands = {
  'h' : '--help',
  'f' : '--from',
  't' : '--to',
  's' : '--standalone',
};
var parsed = nopt(options, shorthands);

if (parsed.help) {
  console.log([
    'Usage: texts [OPTIONS] [FILES]',
    '',
    'Options:',
    '  -f FORMAT             --from=FORMAT',
    '  -t FORMAT             --to=FORMAT',
    '  -s                    --standalone',
    '  -h                    --help',
  ].join('\n'));
  process.exit(1);
}

parsed.from = parsed.from || 'textjson';
parsed.to   = parsed.to   || 'html5';
parsed.standalone = parsed.standalone || false;

var writerOptions = { standalone: parsed.standalone };

// option parsing completed

var io = require('../lib/io');
var fs = require('fs');
var reader = require('../lib/reader/' + parsed.from);
var writer = require('../lib/writer/' + parsed.to);

if (parsed.argv.remain.length) {
  // process files
  parsed.argv.remain.forEach(function(inputFile) {
    var input = fs.readFileSync(inputFile, 'utf8');
    var text = reader(input);
    var output = writer(text, writerOptions);
    io.writeOutput(output);
  });
} else {
  // process stdin
  io.readInput(function (err, input) {
    var text = reader(input);
    var output = writer(text, writerOptions);
    io.writeOutput(output);
  });
}
